import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ABIs
const NonfungiblePositionManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const UniswapV3FactoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function deposit() external payable",
];

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("=================================================");
  console.log(`🌊 Saydex Arc Pool & Liquidity Initializer (Chain ID: ${chainId})`);
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("❌ No deployer account! Please set PRIVATE_KEY in contracts/.env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Native USDC Balance: ${ethers.formatUnits(balance, 18)} USDC`);

  // Target Arc deployments
  // Mainnet (5042) or Testnet (5042002)
  const isMainnet = chainId === 5042;
  const positionManagerAddress = isMainnet
    ? "0x6049c9a0e26405C0985f9E3685C87d0aE917f82B"
    : "0xf72BcA1af1F50C133Ea5211c60c479045A7e5106";

  const factoryAddress = isMainnet
    ? "0xc481038c013fe96f38ce7a2dc417b2b1b78b16a4"
    : "0xE9348e3e3c17D721575e294BE271BCD11028809e";

  const wusdcAddress = "0x4200000000000000000000000000000000000006";

  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`📦 Position Manager: ${positionManagerAddress}`);
  console.log(`💵 WUSDC (Canonical Wrapped USDC): ${wusdcAddress}`);

  // Deploy or load SaydexToken
  console.log("\n1️⃣ Checking SaydexToken deployment...");
  const SaydexTokenFactory = await ethers.getContractFactory("SaydexToken");
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 SAYDEX
  const saydexToken = await SaydexTokenFactory.deploy(initialSupply);
  await saydexToken.waitForDeployment();
  const saydexTokenAddress = await saydexToken.getAddress();
  console.log(`   ✅ SaydexToken on Arc: ${saydexTokenAddress}`);

  // Determine token ordering (Uniswap V3 requires token0 < token1)
  const isWusdcToken0 = wusdcAddress.toLowerCase() < saydexTokenAddress.toLowerCase();
  const token0 = isWusdcToken0 ? wusdcAddress : saydexTokenAddress;
  const token1 = isWusdcToken0 ? saydexTokenAddress : wusdcAddress;

  const fee = 3000; // 0.3%
  console.log(`\n2️⃣ Pair Setup:`);
  console.log(`   token0: ${token0} (${isWusdcToken0 ? "WUSDC" : "SAYDEX"})`);
  console.log(`   token1: ${token1} (${isWusdcToken0 ? "SAYDEX" : "WUSDC"})`);
  console.log(`   fee tier: ${fee} (0.3%)`);

  // Target Price: 1 SAYDEX = 1.25 USDC
  const sqrtPriceX96 = isWusdcToken0
    ? BigInt("70868840251147571348002014766")
    : BigInt("88586050313934464185002518457");

  console.log(`\n3️⃣ Initializing Pool on Arc...`);
  const positionManager = new ethers.Contract(
    positionManagerAddress,
    NonfungiblePositionManagerArtifact.abi,
    deployer
  );

  try {
    const initTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      fee,
      sqrtPriceX96
    );
    await initTx.wait();
    console.log(`   ✅ Pool created & initialized! (Tx: ${initTx.hash})`);
  } catch (err: any) {
    console.log(`   ℹ️ Pool might already exist or initialized: ${err.message || err}`);
  }

  const factory = new ethers.Contract(factoryAddress, UniswapV3FactoryArtifact.abi, deployer);
  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log(`   📍 Uniswap V3 Pool address: ${poolAddress}`);

  console.log("\n=================================================");
  console.log("🚀 Saydex Arc Pool Configuration Complete!");
  console.log(`- Chain: Arc (${chainId})`);
  console.log(`- Token: SAYDEX (${saydexTokenAddress})`);
  console.log(`- Pair: WUSDC / SAYDEX`);
  console.log(`- Pool Address: ${poolAddress}`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error("❌ Arc pool initialization error:", error);
  process.exitCode = 1;
});
