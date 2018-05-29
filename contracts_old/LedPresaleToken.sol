pragma solidity ^0.4.13;

import "./SafeMath.sol";
import "./ERC20.sol";
import "./Controllable.sol";

/**
 * @title LedPresaleToken (LEDP)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */

contract LedPresaleToken is ERC20, Controllable {

  using SafeMath for uint256;

  uint256 public totalSupply;

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;

  string public constant name = "Led Presale Token";
  string public constant symbol = "LEDP";
  uint8 public constant decimals = 18;
  bool public mintingFinished = false;

  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  function LedPresaleToken() {}

  function() payable {
    revert();
  }

  function balanceOf(address _owner) constant returns (uint256) {
    return balances[_owner];
  }

  function transfer(address _to, uint _value) returns (bool) {

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);

    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) returns (bool) {
    var _allowance = allowed[_from][msg.sender];

    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    allowed[_from][msg.sender] = _allowance.sub(_value);

    Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint _value) returns (bool) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint256) {
    return allowed[_owner][_spender];
  }


  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  function mint(address _to, uint256 _amount) onlyController canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    Mint(_to, _amount);
    return true;
  }

  function finishMinting() onlyController returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }


}