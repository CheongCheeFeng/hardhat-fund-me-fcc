// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// Get funds from users
// Withdraw fund
// Set a minimum funding value in USD

// Error code
error FundMe_NotOwner();

/**
 * @title A contract for crowd funding
 * @author Chee Feng
 * @notice You can use this contract to fund your project
 * @dev All function calls are currently implemented without side effects
 */
contract FundMe {
    // using PriceConverter as library for uint256,
    using PriceConverter for uint256;
    // use constant for constant variable to optimize gas
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if someone sends this contract ETH without callling the fund function
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // Want to be able to set a minimum fund amount in USD
        // 1. How do we send Eth to this contract
        // require if first paraam is false then revert with second param
        // What is reverting?
        // Undo any action before and send remaining gas back
        // payable make the contract to hold funds
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); // 1e18 = 1 * 10 * 18 = 1000000000000000000
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset array to blank
        s_funders = new address[](0);
        // 3 way to send Ether to other contracts
        // 1. transfer (transfer required gas fee which maximum at 2300, if more than 2300 will throw error)
        // msg.sender = address
        // payable(msg.sender) = payable address
        // payable(msg.sender).transfer(address(this).balance);

        // 2. send (send required gas fee which maximum at 2300, if more than 2300 will return false boolean)
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // 3. call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funder = s_funders; // do this to save gas fee as s_funders is storage variable, if keep calling it will increase gas fee
        for (
            uint256 funderIndex = 0;
            funderIndex < funder.length;
            funderIndex++
        ) {
            address funderAddress = funder[funderIndex];
            s_addressToAmountFunded[funderAddress] = 0;
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    // function with this decoration will run the code inside first before running it own code
    modifier onlyOwner() {
        //_; code of the function run before
        // require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe_NotOwner();
        }
        _; // code of the function run after
    }

    // getter owner
    function getOwner() public view returns (address) {
        return i_owner;
    }

    // getter funder
    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    // getter addressToAmountFunded
    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    // getter priceFeed
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
