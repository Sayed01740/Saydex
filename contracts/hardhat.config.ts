import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    giwaSepolia: {
      url: process.env.GIWA_RPC_URL || "https://sepolia-rpc.giwa.io",
      chainId: 91342,
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: {
      giwaSepolia: process.env.ETHERSCAN_API_KEY || "giwa",
    },
    customChains: [
      {
        network: "giwaSepolia",
        chainId: 91342,
        urls: {
          apiURL: "https://sepolia-explorer.giwa.io/api",
          browserURL: "https://sepolia-explorer.giwa.io",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
