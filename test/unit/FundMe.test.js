const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  let sendValue;
  beforeEach(async function () {
    // deply contract using hardhat deploy
    // const accounts = await ethers.getSigners();
    sendValue = ethers.parseEther("1");
    deployer = (await getNamedAccounts()).deployer;
    const deploymentResults = await deployments.fixture(["all"]);
    const fundMe_address = deploymentResults["FundMe"]?.address;
    fundMe = await ethers.getContractAt("FundMe", fundMe_address);

    const mockV3Aggregator_address =
      deploymentResults["MockV3Aggregator"]?.address;
    mockV3Aggregator = await ethers.getContractAt(
      "MockV3Aggregator",
      mockV3Aggregator_address
    );
  });

  describe("constructor", async function () {
    it("sets the aggragator address correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, await mockV3Aggregator.getAddress());
    });
  });

  describe("fund", async function () {
    it("fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough");
    });

    it("updated amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getFunder(0);
      assert.equal(response, deployer);
    });
  });

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraw ETH from a single founder", async function () {
      const fundMeAddress = await fundMe.getAddress();
      // Arrange
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { fee } = transactionReceipt;
      // const gasCost = transactionReceipt.gasUsed.mul();
      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        (startingFundMeBalance + startingDeployerBalance).toString(),
        (endingDeployerBalance + fee).toString()
      );
    });

    it("allows us to witdraw from multiple funders", async function () {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const fundMeAddress = await fundMe.getAddress();
      // Arrange
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { fee } = transactionReceipt;

      // Assert
      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        (startingFundMeBalance + startingDeployerBalance).toString(),
        (endingDeployerBalance + fee).toString()
      );

      await expect(fundMe.getFunder(0)).to.be.reverted;

      for (let i = 0; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
          0
        );
      }
    });

    it("only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners();
      const fundMeConnectedContract = await fundMe.connect(accounts[1]);
      await expect(
        fundMeConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe_NotOwner");
    });

    it("cheaper withdraw", async function () {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const fundMeAddress = await fundMe.getAddress();
      // Arrange
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { fee } = transactionReceipt;

      // Assert
      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        (startingFundMeBalance + startingDeployerBalance).toString(),
        (endingDeployerBalance + fee).toString()
      );

      await expect(fundMe.getFunder(0)).to.be.reverted;

      for (let i = 0; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
          0
        );
      }
    });

    it("cheaperWithdraw ETH from a single founder", async function () {
      const fundMeAddress = await fundMe.getAddress();
      // Arrange
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { fee } = transactionReceipt;
      // const gasCost = transactionReceipt.gasUsed.mul();
      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await ethers.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        (startingFundMeBalance + startingDeployerBalance).toString(),
        (endingDeployerBalance + fee).toString()
      );
    });
  });
});
