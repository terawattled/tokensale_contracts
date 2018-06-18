pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./Pausable.sol";
import "./TokenInfo.sol";
import "./LedTokenInterface.sol";


contract Crowdsale is Pausable, TokenInfo {

  using SafeMath for uint256;

  LedTokenInterface public ledToken;
  uint256 public startTime;
  uint256 public endTime;

  uint256 public totalWeiRaised;
  uint256 public tokensMinted;
  uint256 public totalSupply;
  uint256 public contributors;
  uint256 public surplusTokens;

  bool public finalized;

  bool public ledTokensAllocated;
  address public ledMultiSig = LED_MULTISIG;

  //uint256 public tokenCap = FIRSTSALE_TOKENCAP;
  //uint256 public cap = tokenCap * DECIMALS_MULTIPLIER;
  //uint256 public weiCap = tokenCap * FIRSTSALE_BASE_PRICE_IN_WEI;

  bool public started = false;

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  event NewClonedToken(address indexed _cloneToken);
  event OnTransfer(address _from, address _to, uint _amount);
  event OnApprove(address _owner, address _spender, uint _amount);
  event LogInt(string _name, uint256 _value);
  event Finalized();

  // constructor(address _tokenAddress, uint256 _startTime, uint256 _endTime) public {
    

  //   startTime = _startTime;
  //   endTime = _endTime;
  //   ledToken = LedTokenInterface(_tokenAddress);

  //   assert(_tokenAddress != 0x0);
  //   assert(_startTime > 0);
  //   assert(_endTime > _startTime);
  // }

  /**
   * Low level token purchase function
   * @param _beneficiary will receive the tokens.
   */
  /*function buyTokens(address _beneficiary) public payable whenNotPaused whenNotFinalized {
    require(_beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    require(weiAmount >= MIN_PURCHASE && weiAmount <= MAX_PURCHASE);
    uint256 priceInWei = FIRSTSALE_BASE_PRICE_IN_WEI;
    totalWeiRaised = totalWeiRaised.add(weiAmount);

    uint256 tokens = weiAmount.mul(DECIMALS_MULTIPLIER).div(priceInWei);
    tokensMinted = tokensMinted.add(tokens);
    require(tokensMinted < cap);

    contributors = contributors.add(1);

    ledToken.mint(_beneficiary, tokens);
    emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
    forwardFunds();
  }*/


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
  function changeController(address _newController) public onlyOwner {
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

  /*function finalize() public onlyOwner {
    require(paused);
    require(!finalized);
    surplusTokens = cap - tokensMinted;
    ledToken.mint(ledMultiSig, surplusTokens);
    ledToken.transferControl(owner);

    emit Finalized();

    finalized = true;
  }*/

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