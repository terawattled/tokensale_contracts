pragma solidity ^0.4.24;

contract TokenInfo {
    // Base prices in wei, going off from an Ether value of $500
    uint256 public constant PRIVATESALE_BASE_PRICE_IN_WEI = 400000000000000;
    uint256 public constant PRESALE_BASE_PRICE_IN_WEI = 600000000000000;
    uint256 public constant ICO_BASE_PRICE_IN_WEI = 800000000000000;
    uint256 public constant FIRSTSALE_BASE_PRICE_IN_WEI = 200000000000000;

    // First sale minimum and maximum contribution, going off from an Ether value of $500
    uint256 public constant MIN_PURCHASE_OTHERSALES = 200000000000000000;
    uint256 public constant MIN_PURCHASE = 1000000000000000000;
    uint256 public constant MAX_PURCHASE = 1000000000000000000000;

    // Bonus percentages for each respective sale level
    uint256 public constant PRIVATESALE_PERCENTAGE_1 = 20;
    uint256 public constant PRIVATESALE_PERCENTAGE_2 = 25;
    uint256 public constant PRIVATESALE_PERCENTAGE_3 = 35;
    uint256 public constant PRIVATESALE_PERCENTAGE_4 = 50;
    uint256 public constant PRIVATESALE_PERCENTAGE_5 = 100;

    uint256 public constant PRESALE_PERCENTAGE_1 = 10;
    uint256 public constant PRESALE_PERCENTAGE_2 = 15;
    uint256 public constant PRESALE_PERCENTAGE_3 = 20;
    uint256 public constant PRESALE_PERCENTAGE_4 = 25;
    uint256 public constant PRESALE_PERCENTAGE_5 = 35;

    uint256 public constant ICO_PERCENTAGE_1 = 5;
    uint256 public constant ICO_PERCENTAGE_2 = 10;
    uint256 public constant ICO_PERCENTAGE_3 = 15;
    uint256 public constant ICO_PERCENTAGE_4 = 20;
    uint256 public constant ICO_PERCENTAGE_5 = 25;

    // Bonus levels in wei for each respective level
    uint256 public constant PRIVATESALE_LEVEL_1 = 4000000000000000000;
    uint256 public constant PRIVATESALE_LEVEL_2 = 8333333333333333333;
    uint256 public constant PRIVATESALE_LEVEL_3 = 13500000000000000000;
    uint256 public constant PRIVATESALE_LEVEL_4 = 20000000000000000000;
    uint256 public constant PRIVATESALE_LEVEL_5 = 33333333333333333333;

    uint256 public constant PRESALE_LEVEL_1 = 5000000000000000000;
    uint256 public constant PRESALE_LEVEL_2 = 10000000000000000000;
    uint256 public constant PRESALE_LEVEL_3 = 15000000000000000000;
    uint256 public constant PRESALE_LEVEL_4 = 20000000000000000000;
    uint256 public constant PRESALE_LEVEL_5 = 25000000000000000000;

    uint256 public constant ICO_LEVEL_1 = 6666666666666666666;
    uint256 public constant ICO_LEVEL_2 = 13333333333333333333;
    uint256 public constant ICO_LEVEL_3 = 20000000000000000000;
    uint256 public constant ICO_LEVEL_4 = 26666666666666666666;
    uint256 public constant ICO_LEVEL_5 = 33333333333333333333;

    // Caps for the respective sales, the amount of tokens allocated to the team and the total cap
    uint256 public constant PRIVATESALE_TOKENCAP = 18750000;
    uint256 public constant PRESALE_TOKENCAP = 18750000;
    uint256 public constant ICO_TOKENCAP = 22500000;
    uint256 public constant FIRSTSALE_TOKENCAP = 5000000;
    uint256 public constant LEDTEAM_TOKENS = 35000000;
    uint256 public constant TOTAL_TOKENCAP = 100000000;

    uint256 public constant DECIMALS_MULTIPLIER = 1 ether;

    address public constant LED_MULTISIG = 0x865e785f98b621c5fdde70821ca7cea9eeb77ef4;
}