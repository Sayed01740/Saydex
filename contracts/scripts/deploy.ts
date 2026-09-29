import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Official artifacts
const UniswapV3FactoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const NFTDescriptorArtifact = require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json");
const NonfungibleTokenPositionDescriptorArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json");
const NonfungiblePositionManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const SwapRouterArtifact = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");
const SwapRouter02Artifact = require("@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json");
const QuoterV2Artifact = require("@uniswap/swap-router-contracts/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json");
const TickLensArtifact = require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json");

// GIWA Sepolia preloaded WETH address
const WETH9_GIWA = "0x4200000000000000000000000000000000000006";

function linkLibrary(bytecode: string, libraryAddress: string): string {
  const addressWithout0x = libraryAddress.replace("0x", "").toLowerCase();
  // Uniswap library placeholder format: __$hash$__
  return bytecode.replace(/__\$[0-9a-fA-F]+\$__/g, addressWithout0x);
}

async function main() {
  console.log("=================================================");
  console.log("🚀 Starting Saydex Core DEX Deployment on GIWA Sepolia");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "❌ No deployer account found! Please set PRIVATE_KEY in contracts/.env"
    );
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const network = await ethers.provider.getNetwork();

  console.log(`📡 Network: GIWA Sepolia (Chain ID: ${network.chainId.toString()})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`💎 Preloaded WETH9: ${WETH9_GIWA}`);

  if (balance === 0n) {
    console.error("\n❌ ERROR: Deployer balance is 0 ETH! Please fund your wallet on GIWA Sepolia testnet.");
    process.exit(1);
  }

  console.log("\n-------------------------------------------------");
  console.log("1️⃣  Deploying UniswapV3Factory...");
  const FactoryContract = new ethers.ContractFactory(
    UniswapV3FactoryArtifact.abi,
    UniswapV3FactoryArtifact.bytecode,
    deployer
  );
  const factory = await FactoryContract.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`   ✅ UniswapV3Factory deployed at: ${factoryAddress}`);

  console.log("\n-------------------------------------------------");
  console.log("2️⃣  Deploying NFTDescriptor Library...");
  const NFTDescriptorContract = new ethers.ContractFactory(
    NFTDescriptorArtifact.abi,
    NFTDescriptorArtifact.bytecode,
    deployer
  );
  const nftDescriptor = await NFTDescriptorContract.deploy();
  await nftDescriptor.waitForDeployment();
  const nftDescriptorAddress = await nftDescriptor.getAddress();
  console.log(`   ✅ NFTDescriptor deployed at: ${nftDescriptorAddress}`);

  console.log("\n-------------------------------------------------");
  console.log("3️⃣  Deploying NonfungibleTokenPositionDescriptor...");
  const linkedTokenDescriptorBytecode = linkLibrary(
    NonfungibleTokenPositionDescriptorArtifact.bytecode,
    nftDescriptorAddress
  );
  const nativeCurrencyLabel = ethers.encodeBytes32String("ETH");
  const TokenDescriptorContract = new ethers.ContractFactory(
    NonfungibleTokenPositionDescriptorArtifact.abi,
    linkedTokenDescriptorBytecode,
    deployer
  );
  const tokenDescriptor = await TokenDescriptorContract.deploy(
    WETH9_GIWA,
    nativeCurrencyLabel
  );
  await tokenDescriptor.waitForDeployment();
  const tokenDescriptorAddress = await tokenDescriptor.getAddress();
  console.log(`   ✅ NonfungibleTokenPositionDescriptor deployed at: ${tokenDescriptorAddress}`);

  console.log("\n-------------------------------------------------");
  console.log("4️⃣  Deploying NonfungiblePositionManager...");
  const NPMContract = new ethers.ContractFactory(
    NonfungiblePositionManagerArtifact.abi,
    NonfungiblePositionManagerArtifact.bytecode,
    deployer
  );
  const positionManager = await NPMContract.deploy(
    factoryAddress,
    WETH9_GIWA,
    tokenDescriptorAddress
  );
  await positionManager.waitForDeployment();
  const positionManagerAddress = await positionManager.getAddress();
  console.log(`   ✅ NonfungiblePositionManager deployed at: ${positionManagerAddress}`);

  console.log("\n-------------------------------------------------");
  console.log("5️⃣  Deploying SwapRouter02...");
  const Router02Contract = new ethers.ContractFactory(
    SwapRouter02Artifact.abi,
    SwapRouter02Artifact.bytecode,
    deployer
  );
  const swapRouter02 = await Router02Contract.deploy(
    ethers.ZeroAddress, // FactoryV2 (None)
    factoryAddress,     // FactoryV3
    positionManagerAddress,
    WETH9_GIWA
  );
  await swapRouter02.waitForDeployment();
  const swapRouter02Address = await swapRouter02.getAddress();
  console.log(`   ✅ SwapRouter02 deployed at: ${swapRouter02Address}`);

  console.log("\n-------------------------------------------------");
  console.log("6️⃣  Deploying SwapRouter (v3-periphery standard)...");
  const SwapRouterContract = new ethers.ContractFactory(
    SwapRouterArtifact.abi,
    SwapRouterArtifact.bytecode,
    deployer
  );
  const swapRouter = await SwapRouterContract.deploy(
    factoryAddress,
    WETH9_GIWA
  );
  await swapRouter.waitForDeployment();
  const swapRouterAddress = await swapRouter.getAddress();
  console.log(`   ✅ SwapRouter deployed at: ${swapRouterAddress}`);

  console.log("\n-------------------------------------------------");
  console.log("7️⃣  Deploying QuoterV2 (Quote calculation)...");
  const QuoterV2Contract = new ethers.ContractFactory(
    QuoterV2Artifact.abi,
    QuoterV2Artifact.bytecode,
    deployer
  );
  const quoterV2 = await QuoterV2Contract.deploy(
    factoryAddress,
    WETH9_GIWA
  );
  await quoterV2.waitForDeployment();
  const quoterV2Address = await quoterV2.getAddress();
  console.log(`   ✅ QuoterV2 deployed at: ${quoterV2Address}`);

  console.log("\n-------------------------------------------------");
  console.log("8️⃣  Deploying TickLens (Liquidity depth lens)...");
  const TickLensContract = new ethers.ContractFactory(
    TickLensArtifact.abi,
    TickLensArtifact.bytecode,
    deployer
  );
  const tickLens = await TickLensContract.deploy();
  await tickLens.waitForDeployment();
  const tickLensAddress = await tickLens.getAddress();
  console.log(`   ✅ TickLens deployed at: ${tickLensAddress}`);

  const deploymentSummary = {
    network: "giwaSepolia",
    chainId: Number(network.chainId),
    rpc: "https://sepolia-rpc.giwa.io",
    explorer: "https://sepolia-explorer.giwa.io",
    deployedAt: new Date().toISOString(),
    deployer: deployerAddress,
    contracts: {
      WETH9: WETH9_GIWA,
      UniswapV3Factory: factoryAddress,
      NFTDescriptor: nftDescriptorAddress,
      NonfungibleTokenPositionDescriptor: tokenDescriptorAddress,
      NonfungiblePositionManager: positionManagerAddress,
      SwapRouter02: swapRouter02Address,
      SwapRouter: swapRouterAddress,
      QuoterV2: quoterV2Address,
      TickLens: tickLensAddress,
      Multicall3: "0xca11bde05977b3631167028862be2a173976ca11",
    },
  };

  const contractsOutPath = path.join(__dirname, "../deployed-addresses.json");
  const frontendOutPath = path.join(__dirname, "../../src/config/giwa-deployment.json");

  fs.writeFileSync(contractsOutPath, JSON.stringify(deploymentSummary, null, 2));
  fs.writeFileSync(frontendOutPath, JSON.stringify(deploymentSummary, null, 2));

  console.log("\n=================================================");
  console.log("🎉 ALL SAYDEX CONTRACTS SUCCESSFULLY DEPLOYED!");
  console.log("=================================================");
  console.log(JSON.stringify(deploymentSummary, null, 2));
  console.log(`\n📁 Saved addresses to:`);
  console.log(`   - ${contractsOutPath}`);
  console.log(`   - ${frontendOutPath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
