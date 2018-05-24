const BigNumber = require('bignumber.js');
const ganache = require('ganache-cli');
const provider = ganache.provider({default_balance_ether:1000000000000000});
const Web3 = require('web3');
const web3 = new Web3(provider);

const moment = require('moment');

/*import { TOKENS_ALLOCATED_TO_LED, ether } from '../scripts/testConfig.js'
import { getAddress, advanceToBlock, expectInvalidOpcode, waitUntilTransactionsMined, latestTime, increaseTime } from '../scripts/helpers.js'
import { baseUnits, mintToken, getTokenBalance, getTotalSupply } from '../scripts/tokenHelpers.js'
import { transferControl } from '../scripts/controlHelpers.js'
import { enableTransfers, buyTokens, finalize, getCap, getPrice, getPriceInWei, getBasePrice, getBasePriceInWei } from '../scripts/tokenSaleHelpers.js'
import { pause, unpause } from '../scripts/pausableHelpers'*/

const assert = require('assert');

const compiledLedToken = require('../contracts/build/LedToken.json');
const compiledTokenSale = require('../contracts/build/Presale.json');
const compiledLedPresaleToken = require('../contracts/build/LedPresaleToken.json');

let accounts;
let fund;
let tokenSale;
let tokenSaleAddress;
let ledToken;
let ledPresaleToken;
let ledPresaleTokenAddress;
let ledTokenAddress;
let sender;
let receiver;
let hacker;
let wallet;
let ledWalletAddress;

let startTime;
let endTime;
let contractUploadTime;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
  receiver = accounts[2];
  hacker = accounts[3];
  wallet = accounts[5];
  ledWalletAddress = accounts[9];

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:['0x0','0x0',0,'Led Token','PRFT']})
  .send({from:fund,gas:'3000000'});

  ledTokenAddress = ledToken.options.address;

  contractUploadTime = moment.unix(Date.now());
  startTime = contractUploadTime.unix();
  endTime = contractUploadTime.add(31, 'days').unix();
})

describe('Presale Starting and Ending Period', async function() {

  it('should reject payments before start', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1600000000,1610000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});

    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
      assert(false);
    } catch(error) {
      try {
        await web3.eth.sendTransaction({from:sender,to:tokenSaleAddress,value:web3.utils.toWei('1','ether'),gas:'3000000'});
        assert(false);
      } catch (error) {
        assert(true);
      }
    }
  })

  it('should accept payments after start', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});

    let tx = await web3.eth.sendTransaction({
      from:sender,
      to:tokenSaleAddress,
      value:web3.utils.toWei('1','ether'),
      gas:'3000000'
    });
    if (tx) {
      let tx2 = await tokenSale.methods.buyTokens(sender)
      .send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
      if (tx2) {
        assert(true);
      } else {
        assert(false);
      }
    } else {
      assert(false);
    }
  })

  it('should reject payments after end', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1520000020]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});

    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
      assert(false);
    } catch(error) {
      try {
        await web3.eth.sendTransaction({from:sender,to:tokenSaleAddress,value:web3.utils.toWei('1','ether'),gas:'3000000'});
        assert(false);
      } catch (error) {
        assert(true);
      }
    }
  })
})

describe('Presale Token Information', async function() {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});

    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});
  })

  it('should return the correct token supply', async function() {
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let supply = await ledToken.methods.totalSupply().call();
    let tokenSaleDisplaySupply = await tokenSale.methods.totalSupply().call();
    assert.equal(supply,tokenSaleDisplaySupply);
  })

  // the token balance of each token holder can also be displayed via the token sale contract - by routing towards the led token balanceOf() method
  // we verify both balances are equal
  it('should return the correct token balance (tokenSale.balanceOf must be equal to ledToken.balanceOf)', async function() {
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let senderDisplayBalance = await tokenSale.methods.balanceOf(sender).call();
    assert.equal(senderBalance,senderDisplayBalance);
  })
})

describe('Presale Payments', async function() {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});
  })

  it('should accepts ether transactions sent to contract', async function() {
    try {
      await web3.eth.sendTransaction({from:sender, to:tokenSaleAddress, value:web3.utils.toWei('1','ether'), gas:'3000000'});
      assert(true);
    } catch (error) {
      assert(false);
    }
  })

  it('should accept ether through buyTokens function', async function() {
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
      assert(true);
    } catch (error) {
      assert(false);
    }
  })

  it('should increase total token supply', async function() {
    let initialTotalSupply = await ledToken.methods.totalSupply().call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let tokenPriceInWei = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let amountOfTokens = Math.floor((web3.utils.toWei('1','ether')))/tokenPriceInWei;

    /*let expectedSupplyIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
    expectedSupplyIncrease = await baseUnits(ledToken, expectedSupplyIncrease)*/

    let totalSupply = await ledToken.methods.totalSupply().call();

    let supplyIncrease = (totalSupply - initialTotalSupply);
    let supplyBase = supplyIncrease/(10**18);

    let difference = Math.abs(supplyBase-amountOfTokens);
    assert.ok(difference<0.1);
  })

  it('should increase total supply by 2263.4 for 1 ether raised', async function() {
    let initialTotalSupply = await ledToken.methods.totalSupply().call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let totalSupply = await ledToken.methods.totalSupply().call();
    let supplyIncrease = (totalSupply - initialTotalSupply);
    let supplyBase = supplyIncrease/(10**18);

    assert.equal(Math.floor(supplyBase),2263);
  })

  it('should transfer money to the wallet after receiving investment', async function() {
    let multisig = await tokenSale.methods.ledMultiSig().call();
    let initialBalance = await web3.eth.getBalance(multisig);
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let balance = await web3.eth.getBalance(multisig);
    let balanceIncrease = (balance - initialBalance);
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(balanceBase>0.9);
  })

  it('should create tokens for the sender', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = tokenBalance - initialTokenBalance;
    let balanceBase = balanceIncrease/(10**18);

    let tokenPriceInWei = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let expectedBalanceIncrease = Math.floor((web3.utils.toWei('1','ether')))/tokenPriceInWei;

    assert.equal(balanceBase,expectedBalanceIncrease);
  })

  it('should increase buyer balance by 2263.4 for 1 ether invested', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let balanceBase = balanceIncrease/(10**18);
    assert.equal(Math.floor(balanceBase), 2263);
  })
})


// Removed this section because it is a duplicate of initialState.test.js

/*describe('Initial State', function () {
  beforeEach(async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
  })

  it('should initially set the multisig', async function() {
    let multisigUpper = await tokenSale.methods.ledMultiSig().call();
    let multisig = multisigUpper.toLowerCase();
    assert.equal(multisig,ledMultiSig);
  })

  it('should initially be linked to the Led token', async function() {
    let tokenSaleToken = await tokenSale.methods.ledToken().call();
    assert.equal(tokenSaleToken,ledTokenAddress);
  })

  it('Initial Price should be equal to 0.000119 ether', async function() {
    let price = await tokenSale.methods.getPriceInWei().call();
    assert.equal(price, 119000000000000);
  })

  it('Base Price should be equal to 0.00014 ether', async function() {
    let price = await tokenSale.methods.BASE_PRICE_IN_WEI().call();
    assert.equal(price, 140000000000000);
  })

  //Removed this test as well, as it seems kind of pointless, and not at all what the cap is intended for.

  it('cap should be equal to remaining tokens adjusted to multiplier', async function() {
    let cap = await tokenSale.methods.cap().call();
    assert.equal(cap, 1068644);
  })
})*/

describe('Presale Finalized state', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});

    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});
  })

  it('should initially not be finalized', async function() {
    let finalized = await tokenSale.methods.finalized().call();
    assert(!finalized);
  })

  it('should not be finalizeable if the token sale is not paused', async function() {
    try {
      await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
      assert(false);
    } catch(error) {
      let finalized = await tokenSale.methods.finalized().call();
      assert(!finalized);
    }
  })

  it('should be finalizeable if the token sale is paused', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
    let finalized = await tokenSale.methods.finalized().call();
    assert(finalized);
  })

  it('should not be finalizeable if the token sale is paused/unpaused', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.unpause().send({from:fund,gas:'3000000'});
    try {
      await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
      assert(false);
    } catch(error) {
      let finalized = await tokenSale.methods.finalized().call();
      assert(!finalized);
    }
  })

  it('should not be finalizeable by non-owner', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    try {
      await tokenSale.methods.finalize().send({from:hacker,gas:'3000000'});
      assert(false);
    } catch(error) {
      let finalized = await tokenSale.methods.finalized().call();
      assert(!finalized);
    }
  })

  it('should not have stopped the minting process after finalizing',async function(){
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
    let finished = await ledToken.methods.mintingFinished().call();
    assert(!finished);
  })
  
  it('should allocate the surplus tokens to the LED team after finishing', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
    let teamAddress = await tokenSale.methods.ledMultiSig().call();
    let teamBalance = await ledToken.methods.balanceOf(teamAddress).call();
    assert.ok(teamBalance>0);
  })
})

describe('Presale Buying Tokens', async function() {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});
  })

  it('should have a base token price of 441813201378457 wei',async function () {
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    assert.equal(basePrice, 441813201378457);
  })

  it('should offer a 10% bonus if more than 3 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('4','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.1), Math.floor(balanceBase));
  })

  it('should offer a 15% bonus if more than 6 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('7','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.15), Math.floor(balanceBase));
  })

  it('should offer a 20% bonus if more than 9 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('10','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.2), Math.floor(balanceBase));
  })

  it('should offer a 25% bonus if more than 12 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('13','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.25), Math.floor(balanceBase));
  })

  it('should offer a 35% bonus if more than 15 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('16','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.35), Math.floor(balanceBase));
  })

  it('should throw if the number of tokens exceeds the cap', async function() {
    let basePriceInWei = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let initialBalance = await ledToken.methods.balanceOf(sender).call();

    let amount = 0.73 * capInWei * (1.1);
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:amount,gas:'3000000'});
      assert(false);
    } catch(error) {
      let balance = await ledToken.methods.balanceOf(sender).call();
      assert.equal(balance,initialBalance);
    }
  })

  it('should not throw if the number of tokens hits just below the cap', async function() {
    let basePriceInWei = await tokenSale.methods.PRESALE_BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let initialBalance = await ledToken.methods.balanceOf(sender).call();

    let amount = 0.73 * capInWei * (0.99);
    amount = BigNumber(amount);
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:amount,gas:'3000000'});
      assert(true);
    } catch(error) {
      assert(false);
    }
  })

  it('should increase the number of contributors by 1', async function() {
    let initialContributors = await tokenSale.methods.contributors().call();
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
    let contributors = await tokenSale.methods.contributors().call();
    assert(contributors>initialContributors);
  })
})

