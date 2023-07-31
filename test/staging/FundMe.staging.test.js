const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");

developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let sendValue;
      beforeEach(async function () {
        // deply contract using hardhat deploy
        // const accounts = await ethers.getSigners();
        sendValue = ethers.parseEther("1");

        deployer = (await getNamedAccounts()).deployer;

        const fundMe_address = (await deployments.get("FundMe")).address;
        fundMe = await ethers.getContractAt("FundMe", fundMe_address);
      });

      it("allows people to fund and witdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingBalance = await ethers.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
