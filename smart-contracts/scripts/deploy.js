// This is a script for deploying your contracts. You can adapt it to deploy
// any contract you want.

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that,
// Hardhat will compile your contracts, add the Hardhat Runtime Environment's
// members to the global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy. 'ethers' is a library that comes with
  // Hardhat to help us interact with Ethereum.
  // 'getContractFactory' is like a template or class to create new smart contract instances.
  const ContentManager = await hre.ethers.getContractFactory("ContentManager");

  // We deploy the contract. This sends a transaction to the blockchain.
  const contentManager = await ContentManager.deploy();

  // We wait for the transaction to be mined and the contract to be officially deployed.
  await contentManager.waitForDeployment();

  // We log the contract's address to the console. This address is its unique ID on the blockchain.
  console.log(
    `ContentManager contract deployed to: ${contentManager.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});