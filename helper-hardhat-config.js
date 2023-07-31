// What helper-hardhat-config do is to make the hardhat.config.js file more readable and easier to maintain.
// It also allows us to use the same config file for different networks.
// For example, we can use the same config file for both localhost and sepolia networks.

const networkConfig = {
  11155111: {
    ethUsdPriceFeed: "0x694aa1769357215de4fac081bf1f309adc325306",
    name: "sepolia",
  },
};

const developmentChain = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;

module.exports = { networkConfig, developmentChain, DECIMALS, INITIAL_ANSWER };
