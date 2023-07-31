const { getNamedAccounts, ethers, deployments } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMeAddress = (await deployments.get("FundMe")).address;
  const fundMe = await ethers.getContractAt("FundMe", fundMeAddress);
  await fundMe.connect(deployer);
  console.log("Withdrawing from contract");
  const txResponse = await fundMe.withdraw();
  await txResponse.wait(1);
  console.log("Withdrawn");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
