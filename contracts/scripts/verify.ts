import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// GIWA Sepolia preloaded WETH address
const WETH9_GIWA = "0x4200000000000000000000000000000000000006";

async function main() {
  console.log("=================================================");
  console.log("🔍 Saydex GIWA Explorer Contract Verification Helper");
  console.log("=================================================");

  const addressesPath = path.join(__dirname, "../deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ deployed-addresses.json not found! Please run deploy:giwa first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const c = deployment.contracts;

  console.log(`📡 Network: ${deployment.network} (Chain ID: ${deployment.chainId})`);
  console.log(`🌐 Explorer: ${deployment.explorer}\n`);

  // Constructor arguments encoding
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  // 1. UniswapV3Factory
  const factoryArgs = "";

  // 2. NFTDescriptor
  const nftDescriptorArgs = "";

  // 3. NonfungibleTokenPositionDescriptor
  const nativeCurrencyLabel = ethers.encodeBytes32String("ETH");
  const tokenDescArgs = abiCoder.encode(
    ["address", "bytes32"],
    [WETH9_GIWA, nativeCurrencyLabel]
  ).slice(2);

  // 4. NonfungiblePositionManager
  const npmArgs = abiCoder.encode(
    ["address", "address", "address"],
    [c.UniswapV3Factory, WETH9_GIWA, c.NonfungibleTokenPositionDescriptor]
  ).slice(2);

  // 5. SwapRouter02
  const router02Args = abiCoder.encode(
    ["address", "address", "address", "address"],
    [ethers.ZeroAddress, c.UniswapV3Factory, c.NonfungiblePositionManager, WETH9_GIWA]
  ).slice(2);

  // 6. SwapRouter
  const routerArgs = abiCoder.encode(
    ["address", "address"],
    [c.UniswapV3Factory, WETH9_GIWA]
  ).slice(2);

  // 7. QuoterV2
  const quoterArgs = abiCoder.encode(
    ["address", "address"],
    [c.UniswapV3Factory, WETH9_GIWA]
  ).slice(2);

  // 8. TickLens
  const tickLensArgs = "";

  const verificationData = [
    {
      name: "UniswapV3Factory",
      address: c.UniswapV3Factory,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: factoryArgs,
      url: `${deployment.explorer}/address/${c.UniswapV3Factory}?tab=contract`,
    },
    {
      name: "NFTDescriptor",
      address: c.NFTDescriptor,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: nftDescriptorArgs,
      url: `${deployment.explorer}/address/${c.NFTDescriptor}?tab=contract`,
    },
    {
      name: "NonfungibleTokenPositionDescriptor",
      address: c.NonfungibleTokenPositionDescriptor,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: tokenDescArgs,
      url: `${deployment.explorer}/address/${c.NonfungibleTokenPositionDescriptor}?tab=contract`,
    },
    {
      name: "NonfungiblePositionManager",
      address: c.NonfungiblePositionManager,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: npmArgs,
      url: `${deployment.explorer}/address/${c.NonfungiblePositionManager}?tab=contract`,
    },
    {
      name: "SwapRouter02",
      address: c.SwapRouter02,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: router02Args,
      url: `${deployment.explorer}/address/${c.SwapRouter02}?tab=contract`,
    },
    {
      name: "SwapRouter",
      address: c.SwapRouter,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: routerArgs,
      url: `${deployment.explorer}/address/${c.SwapRouter}?tab=contract`,
    },
    {
      name: "QuoterV2",
      address: c.QuoterV2,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: quoterArgs,
      url: `${deployment.explorer}/address/${c.QuoterV2}?tab=contract`,
    },
    {
      name: "TickLens",
      address: c.TickLens,
      compiler: "v0.7.6+commit.7338295f",
      optimizer: "200 runs",
      constructorArguments: tickLensArgs,
      url: `${deployment.explorer}/address/${c.TickLens}?tab=contract`,
    },
  ];

  console.log("📋 CONTRACT VERIFICATION DETAILS:");
  console.log("-------------------------------------------------");
  for (const item of verificationData) {
    console.log(`\n📌 ${item.name}:`);
    console.log(`   Address: ${item.address}`);
    console.log(`   Explorer Link: ${item.url}`);
    if (item.constructorArguments) {
      console.log(`   Constructor Arguments (ABI-encoded): ${item.constructorArguments}`);
    } else {
      console.log(`   Constructor Arguments: None`);
    }
  }

  const outPath = path.join(__dirname, "../verification-details.json");
  fs.writeFileSync(outPath, JSON.stringify(verificationData, null, 2));
  console.log(`\n💾 Saved verification parameters to: ${outPath}`);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
