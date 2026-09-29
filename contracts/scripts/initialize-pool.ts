import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ABIs
const NonfungiblePositionManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const UniswapV3FactoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const WETH_ABI = [
  "function deposit() external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

async function main() {
  console.log("=================================================");
  console.log("🌊 Saydex GIWA Sepolia Pool & Liquidity Initializer");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("❌ No deployer account! Please set PRIVATE_KEY in contracts/.env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.002")) {
    console.warn("⚠️ Low balance! At least 0.002 ETH is recommended to wrap 0.001 ETH and pay gas.");
  }

  // Load deployed addresses
  const deployedPath = path.join(__dirname, "../deployed-addresses.json");
  const deployedData = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const contracts = deployedData.contracts;

  const wethAddress = contracts.WETH9;
  const factoryAddress = contracts.UniswapV3Factory;
  const positionManagerAddress = contracts.NonfungiblePositionManager;

  console.log(`💎 Canonical WETH9: ${wethAddress}`);
  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`📦 Position Manager: ${positionManagerAddress}`);

  // 1. Deploy SaydexToken (if not already recorded)
  let saydexTokenAddress = contracts.SaydexToken;
  if (!saydexTokenAddress) {
    console.log("\n1️⃣ Deploying SaydexToken (SAYDEX) ERC-20 contract...");
    const SaydexTokenFactory = await ethers.getContractFactory("SaydexToken");
    const initialSupply = ethers.parseEther("1000000"); // 1,000,000 SAYDEX
    const saydexToken = await SaydexTokenFactory.deploy(initialSupply);
    await saydexToken.waitForDeployment();
    saydexTokenAddress = await saydexToken.getAddress();
    console.log(`   ✅ SaydexToken deployed at: ${saydexTokenAddress}`);

    contracts.SaydexToken = saydexTokenAddress;
    fs.writeFileSync(deployedPath, JSON.stringify(deployedData, null, 2));
  } else {
    console.log(`\n1️⃣ Using existing SaydexToken: ${saydexTokenAddress}`);
  }

  // 2. Wrap 0.001 ETH into WETH
  console.log("\n2️⃣ Wrapping 0.001 ETH into WETH9...");
  const wethContract = new ethers.Contract(wethAddress, WETH_ABI, deployer);
  const wrapAmount = ethers.parseEther("0.001");
  const wrapTx = await wethContract.deposit({ value: wrapAmount });
  await wrapTx.wait();
  console.log(`   ✅ Wrapped 0.001 ETH -> WETH9 (Tx: ${wrapTx.hash})`);

  // 3. Determine token ordering (Uniswap V3 requires token0 < token1)
  const isWethToken0 = wethAddress.toLowerCase() < saydexTokenAddress.toLowerCase();
  const token0 = isWethToken0 ? wethAddress : saydexTokenAddress;
  const token1 = isWethToken0 ? saydexTokenAddress : wethAddress;

  const fee = 3000; // 0.3%
  console.log(`\n3️⃣ Pair Setup:`);
  console.log(`   token0: ${token0} (${isWethToken0 ? "WETH" : "SAYDEX"})`);
  console.log(`   token1: ${token1} (${isWethToken0 ? "SAYDEX" : "WETH"})`);
  console.log(`   fee tier: ${fee} (0.3%)`);

  // Initial Price: 1 WETH = 1000 SAYDEX
  // sqrtPriceX96 = sqrt(price) * 2^96
  // price = token1 / token0
  // If token0 is WETH: price = 1000 -> sqrt(1000) * 2^96 = 250541448375047931186413801569
  // If token0 is SAYDEX: price = 0.001 -> sqrt(0.001) * 2^96 = 250541448375047931186413801
  const sqrtPriceX96 = isWethToken0
    ? BigInt("250541448375047931186413801569")
    : BigInt("250541448375047931186413801");

  console.log(`\n4️⃣ Creating and initializing pool via NonfungiblePositionManager...`);
  const positionManager = new ethers.Contract(
    positionManagerAddress,
    NonfungiblePositionManagerArtifact.abi,
    deployer
  );

  const initTx = await positionManager.createAndInitializePoolIfNecessary(
    token0,
    token1,
    fee,
    sqrtPriceX96
  );
  await initTx.wait();
  console.log(`   ✅ Pool created & initialized! (Tx: ${initTx.hash})`);

  // Verify pool on factory
  const factory = new ethers.Contract(factoryAddress, UniswapV3FactoryArtifact.abi, deployer);
  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log(`   📍 Uniswap V3 Pool address: ${poolAddress}`);
  contracts.Pool_WETH_SAYDEX_3000 = poolAddress;
  fs.writeFileSync(deployedPath, JSON.stringify(deployedData, null, 2));

  // 5. Approve Position Manager
  console.log("\n5️⃣ Approving tokens for Position Manager...");
  const maxApproval = ethers.MaxUint256;
  const approveWethTx = await wethContract.approve(positionManagerAddress, maxApproval);
  await approveWethTx.wait();

  const saydexContract = new ethers.Contract(saydexTokenAddress, ERC20_ABI, deployer);
  const approveSaydexTx = await saydexContract.approve(positionManagerAddress, maxApproval);
  await approveSaydexTx.wait();
  console.log("   ✅ Tokens approved.");

  // 6. Mint initial liquidity position
  console.log("\n6️⃣ Minting initial concentrated liquidity position...");
  const amountWethDesired = ethers.parseEther("0.0008");
  const amountSaydexDesired = ethers.parseEther("800"); // 800 SAYDEX (~0.8 ETH equivalent)

  const amount0Desired = isWethToken0 ? amountWethDesired : amountSaydexDesired;
  const amount1Desired = isWethToken0 ? amountSaydexDesired : amountWethDesired;

  // Full tick range rounded to tickSpacing (60 for fee 3000)
  // -887220 to 887220
  const tickLower = -887220;
  const tickUpper = 887220;

  const mintParams = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployerAddress,
    deadline: Math.floor(Date.now() / 1000) + 1800,
  };

  const mintTx = await positionManager.mint(mintParams);
  const receipt = await mintTx.wait();
  console.log(`   🎉 Liquidity successfully deposited! (Tx: ${mintTx.hash})`);

  console.log("\n=================================================");
  console.log("🚀 Saydex GIWA Liquidity Pool is LIVE!");
  console.log(`- Token: SAYDEX (${saydexTokenAddress})`);
  console.log(`- Pair: WETH / SAYDEX`);
  console.log(`- Pool: ${poolAddress}`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error("❌ Pool initialization failed:", error);
  process.exitCode = 1;
});
