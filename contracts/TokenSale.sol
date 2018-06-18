pragma solidity ^0.4.24;

import "./Crowdsale.sol";
import "./LedTokenInterface.sol";
/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based

 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
contract TokenSale is Crowdsale {

  uint256 public tokenCap = ICO_TOKENCAP;
  uint256 public cap = tokenCap * DECIMALS_MULTIPLIER;
  uint256 public weiCap = tokenCap * ICO_BASE_PRICE_IN_WEI;

  uint256 public allocatedTokens;

  constructor(address _tokenAddress, uint256 _startTime, uint256 _endTime) public {
    

    startTime = _startTime;
    endTime = _endTime;
    ledToken = LedTokenInterface(_tokenAddress);

    assert(_tokenAddress != 0x0);
    assert(_startTime > 0);
    assert(_endTime > _startTime);
  }

    /**
   * High level token purchase function
   */
  function() public payable {
    buyTokens(msg.sender);
  }

  /**
   * Low level token purchase function
   * @param _beneficiary will receive the tokens.
   */
  function buyTokens(address _beneficiary) public payable whenNotPaused whenNotFinalized {
    require(_beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    require(weiAmount >= MIN_PURCHASE_OTHERSALES && weiAmount <= MAX_PURCHASE);
    uint256 priceInWei = ICO_BASE_PRICE_IN_WEI;
    totalWeiRaised = totalWeiRaised.add(weiAmount);

    uint256 bonusPercentage = determineBonus(weiAmount);
    uint256 bonusTokens;

    uint256 initialTokens = weiAmount.mul(DECIMALS_MULTIPLIER).div(priceInWei);
    if(bonusPercentage>0){
      uint256 initialDivided = initialTokens.div(100);
      bonusTokens = initialDivided.mul(bonusPercentage);
    } else {
      bonusTokens = 0;
    }
    uint256 tokens = initialTokens.add(bonusTokens);
    tokensMinted = tokensMinted.add(tokens);
    require(tokensMinted < cap);

    contributors = contributors.add(1);

    ledToken.mint(_beneficiary, tokens);
    emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
    forwardFunds();
  }

  function determineBonus(uint256 _wei) public view returns (uint256) {
    if(_wei > ICO_LEVEL_1) {
      if(_wei > ICO_LEVEL_2) {
        if(_wei > ICO_LEVEL_3) {
          if(_wei > ICO_LEVEL_4) {
            if(_wei > ICO_LEVEL_5) {
              return ICO_PERCENTAGE_5;
            } else {
              return ICO_PERCENTAGE_4;
            }
          } else {
            return ICO_PERCENTAGE_3;
          }
        } else {
          return ICO_PERCENTAGE_2;
        }
      } else {
        return ICO_PERCENTAGE_1;
      }
    } else {
      return 0;
    }
  }

  function allocateLedTokens() public onlyOwner whenNotFinalized {
    require(!ledTokensAllocated);
    allocatedTokens = LEDTEAM_TOKENS.mul(DECIMALS_MULTIPLIER);
    ledToken.mint(ledMultiSig, allocatedTokens);
    ledTokensAllocated = true;
  }

  function finalize() public onlyOwner {
    require(paused);
    require(ledTokensAllocated);

    surplusTokens = cap - tokensMinted;
    ledToken.mint(ledMultiSig, surplusTokens);

    ledToken.finishMinting();
    ledToken.enableTransfers(true);
    emit Finalized();

    finalized = true;
  }

  function getInfo() public view returns(uint256, uint256, string, bool,  uint256, uint256, uint256, 
  bool, uint256, uint256){
    uint256 decimals = 18;
    string memory symbol = "LED";
    bool transfersEnabled = ledToken.transfersEnabled();
    return (
      TOTAL_TOKENCAP, // Tokencap with the decimal point in place. should be 100.000.000
      decimals, // Decimals
      symbol,
      transfersEnabled,
      contributors,
      totalWeiRaised,
      tokenCap, // Tokencap for the first sale with the decimal point in place.
      started,
      startTime, // Start time and end time in Unix timestamp format with a length of 10 numbers.
      endTime
    );
  }
  
  function getInfoLevels() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, 
  uint256, uint256, uint256, uint256){
    return (
      ICO_LEVEL_1, // Amount of ether needed per bonus level
      ICO_LEVEL_2,
      ICO_LEVEL_3,
      ICO_LEVEL_4,
      ICO_LEVEL_5,
      ICO_PERCENTAGE_1, // Bonus percentage per bonus level
      ICO_PERCENTAGE_2,
      ICO_PERCENTAGE_3,
      ICO_PERCENTAGE_4,
      ICO_PERCENTAGE_5
    );
  }

}