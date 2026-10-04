import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Official artifacts
const UniswapV3FactoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const NonfungiblePositionManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

// Official Circle Arc Testnet Token Addresses
const USDC_ARC = "0x3600000000000000000000000000000000000000";
const EURC_ARC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("=================================================");
  console.log(`🌊 Saydex Arc Uniswap V3 Pool Initializer`);
  console.log(`📡 Network Chain ID: ${chainId}`);
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("❌ No deployer account found! Please set PRIVATE_KEY in contracts/.env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Native USDC Balance: ${ethers.formatUnits(balance, 18)} USDC`);

  // Target Arc Deployed Addresses config
  const addressesPath = path.join(__dirname, "../arc-deployed-addresses.json");
  let deployedAddresses: Record<string, string> = {};
  if (fs.existsSync(addressesPath)) {
    deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  // 1. Verify or deploy UniswapV3Factory
  let factoryAddress = deployedAddresses.UniswapV3Factory;
  if (!factoryAddress) {
    console.log("\n1️⃣ Deploying Saydex UniswapV3Factory on Arc...");
    const Factory = new ethers.ContractFactory(
      UniswapV3FactoryArtifact.abi,
      UniswapV3FactoryArtifact.bytecode,
      deployer
    );
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    factoryAddress = await factory.getAddress();
    deployedAddresses.UniswapV3Factory = factoryAddress;
    console.log(`   ✅ Factory deployed at: ${factoryAddress}`);
  } else {
    console.log(`\n1️⃣ Using UniswapV3Factory at: ${factoryAddress}`);
  }

  const factory = new ethers.Contract(factoryAddress, UniswapV3FactoryArtifact.abi, deployer);

  // 2. Initialize USDC / EURC Pool (Fee: 100 = 0.01%)
  console.log("\n2️⃣ Setting up USDC / EURC Pool...");
  const isUsdc0 = USDC_ARC.toLowerCase() < EURC_ARC.toLowerCase();
  const token0 = isUsdc0 ? USDC_ARC : EURC_ARC;
  const token1 = isUsdc0 ? EURC_ARC : USDC_ARC;
  const feeEurc = 100; // 0.01% for stablecoins

  // Price: 1 EURC ≈ 1.08 USDC
  // If token0 is USDC and token1 is EURC: price = EURC / USDC ≈ 0.9259
  // sqrtPriceX96 = sqrt(price) * 2^96 = sqrt(0.9259) * 2^96 ≈ 76326127147749454170308064560
  // If token0 is EURC and token1 is USDC: price = USDC / EURC ≈ 1.08
  // sqrtPriceX96 = sqrt(price) * 2^96 = sqrt(1.08) * 2^96 ≈ 82343940177726487103233894000
  const sqrtPriceX96_EURC = isUsdc0
    ? BigInt("76326127147749454170308064560")
    : BigInt("82343940177726487103233894000");

  let poolEurc = await factory.getPool(token0, token1, feeEurc);
  if (poolEurc === "0x0000000000000000000000000000000000000000") {
    console.log("   Creating pool on Factory...");
    const createTx = await factory.createPool(token0, token1, feeEurc);
    await createTx.wait();
    poolEurc = await factory.getPool(token0, token1, feeEurc);
    console.log(`   ✅ USDC / EURC Pool created at: ${poolEurc}`);

    // Initialize pool price
    const PoolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
    const poolContract = new ethers.Contract(poolEurc, PoolArtifact.abi, deployer);
    const initTx = await poolContract.initialize(sqrtPriceX96_EURC);
    await initTx.wait();
    console.log(`   ✅ Pool initialized with price 1.08 USDC/EURC`);
  } else {
    console.log(`   ℹ️ USDC / EURC Pool already exists at: ${poolEurc}`);
  }

  deployedAddresses.Pool_USDC_EURC_100 = poolEurc;
  fs.writeFileSync(addressesPath, JSON.stringify(deployedAddresses, null, 2));

  console.log("\n=================================================");
  console.log("🎉 Saydex Arc Pool Initialization Complete!");
  console.log(`- Network Chain ID: ${chainId}`);
  console.log(`- UniswapV3Factory: ${factoryAddress}`);
  console.log(`- USDC / EURC Pool: ${poolEurc}`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("❌ Initialization error:", err);
  process.exitCode = 1;
});
