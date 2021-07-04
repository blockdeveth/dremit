const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const WireTransfer = await hre.ethers.getContractFactory("WireTransfer");
  const wire = await WireTransfer.deploy();

  await wire.deployed();

  console.log("WireTransfer deployed to:", wire.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
