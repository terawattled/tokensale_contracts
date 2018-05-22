pragma solidity ^0.4.13;

import './SafeMath.sol';
import './Pausable.sol';
import './LedTokenInterface.sol';
import './TokenInfo.sol';
/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based

 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
contract Presale is Pausable, TokenInfo {

  using SafeMath for uint256;

  LedTokenInterface public ledToken;
  uint256 public totalWeiRaised;
  uint256 public tokensMinted;
  uint256 public totalSupply;
  uint256 public contributors;
  uint256 public decimalsMultiplier;
  uint256 public startTime;
  uint256 public endTime;
  uint256 public surplusTokens;

  bool public finalized;

  bool public ledTokensAllocated;
  address public ledMultiSig = LED_MULTISIG;

  uint256 public tokenCap = PRESALE_TOKENCAP;
  uint256 public cap = tokenCap * (10 ** 18);
  uint256 public weiCap = tokenCap * PRESALE_BASE_PRICE_IN_WEI;

  bool public started = false;

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  event NewClonedToken(address indexed _cloneToken);
  event OnTransfer(address _from, address _to, uint _amount);
  event OnApprove(address _owner, address _spender, uint _amount);
  event LogInt(string _name, uint256 _value);
  event Finalized();

  function Presale(address _tokenAddress, uint256 _startTime, uint256 _endTime) public {
    require(_tokenAddress != 0x0);
    require(_startTime > 0);
    require(_endTime > _startTime);

    startTime = _startTime;
    endTime = _endTime;
    ledToken = LedTokenInterface(_tokenAddress);

    decimalsMultiplier = (10 ** 18);
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
    uint256 priceInWei = PRESALE_BASE_PRICE_IN_WEI;
    totalWeiRaised = totalWeiRaised.add(weiAmount);

    uint256 bonusPercentage = determineBonus(weiAmount);

    uint256 initialTokens = weiAmount.mul(decimalsMultiplier).div(priceInWei);
    uint256 bonusTokens = initialTokens.mul(bonusPercentage/100);
    uint256 tokens = initialTokens.add(bonusTokens);
    tokensMinted = tokensMinted.add(tokens);
    require(tokensMinted < cap);

    contributors = contributors.add(1);

    ledToken.mint(_beneficiary, tokens);
    TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
    forwardFunds();
  }

  function determineBonus(uint256 _wei) constant public returns (uint256) {
    if(_wei > PRESALE_LEVEL_1) {
      if(_wei > PRESALE_LEVEL_2) {
        if(_wei > PRESALE_LEVEL_3) {
          if(_wei > PRESALE_LEVEL_4) {
            if(_wei > PRESALE_LEVEL_5) {
              return PRESALE_PERCENTAGE_5;
            } else {
              return PRESALE_PERCENTAGE_4;
            }
          } else {
            return PRESALE_PERCENTAGE_3;
          }
        } else {
          return PRESALE_PERCENTAGE_2;
        }
      } else {
        return PRESALE_PERCENTAGE_1;
      }
    } else {
      return 0;
    }
  }


  /**
  * Forwards funds to the tokensale wallet
  */
  function forwardFunds() internal {
    ledMultiSig.transfer(msg.value);
  }


  /**
  * Validates the purchase (period, minimum amount, within cap)
  * @return {bool} valid
  */
  function validPurchase() internal constant returns (bool) {
    uint256 current = now;
    bool presaleStarted = (current >= startTime || started);
    bool presaleNotEnded = current <= endTime;
    bool nonZeroPurchase = msg.value != 0;
    return nonZeroPurchase && presaleStarted && presaleNotEnded;
  }

  /**
  * Returns the total Led token supply
  * @return totalSupply {uint256} Led Token Total Supply
  */
  function totalSupply() public constant returns (uint256) {
    return ledToken.totalSupply();
  }

  /**
  * Returns token holder Led Token balance
  * @param _owner {address} Token holder address
  * @return balance {uint256} Corresponding token holder balance
  */
  function balanceOf(address _owner) public constant returns (uint256) {
    return ledToken.balanceOf(_owner);
  }

  /**
  * Change the Led Token controller
  * @param _newController {address} New Led Token controller
  */
  function changeController(address _newController) public {
    require(isContract(_newController));
    ledToken.transferControl(_newController);
  }

  function enableMasterTransfers() public onlyOwner {
    ledToken.enableMasterTransfers(true);
  }

  function lockMasterTransfers() public onlyOwner {
    ledToken.enableMasterTransfers(false);
  }

  function forceStart() public onlyOwner {
    started = true;
  }

  function finalize() public onlyOwner {
    require(paused);
    surplusTokens = cap - tokensMinted;
    ledToken.mint(ledMultiSig, surplusTokens);

    Finalized();

    finalized = true;
  }


  function isContract(address _addr) constant internal returns(bool) {
    uint size;
    if (_addr == 0)
      return false;
    assembly {
        size := extcodesize(_addr)
    }
    return size>0;
  }

  modifier whenNotFinalized() {
    require(!finalized);
    _;
  }

}