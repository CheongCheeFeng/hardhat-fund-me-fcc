const { run } = require("hardhat");

async function verify(contractAddress, args) {
  console.log("Verfying contract....");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified!");
    } else {
      console.error(error);
    }
  }
}

module.exports = { verify };
