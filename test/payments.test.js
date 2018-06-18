const BigNumber = require('bignumber.js');

const ganache = require('ganache-cli');
const provider = ganache.provider({default_balance_ether:1000000000000000});
const Web3 = require('web3');
const web3 = new Web3(provider);

const moment = require('moment');

/*import { DEFAULT_GAS,
         DEFAULT_GAS_PRICE,
         ether } from '../scripts/testConfig.js'

import { getAddress,
         sendTransaction,
         expectInvalidOpcode,
         getBalance,
         advanceToBlock,
         latestTime,
         increaseTime } from '../scripts/helpers.js'

import { getTotalSupply,
         getTokenBalance,
         baseUnits } from '../scripts/tokenHelpers.js'

import { buyTokens,
         numberOfTokensFor,
         getWallet,
         getBasePriceInWei,
         getPriceInWei,
         getMultisig,
         getCap,
         getContributors,
         enableTransfers } from '../scripts/tokenSaleHelpers.js'

import { transferControl } from '../scripts/controlHelpers.js'*/

const assert = require('assert');

const compiledLedToken = require('../mastercontract/build/LedToken.json');
const compiledTokenSale = require('../mastercontract/build/TokenSale.json');

let accounts;
let fund;
let tokenSale;
let tokenSaleAddress;
let ledToken;
let ledTokenAddress;
let sender;
let wallet;

let startTime;
let endTime;
let contractUploadTime;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
  wallet = accounts[5];

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:['0x0','0x0',0,'Led Token','LED']})
  .send({from:fund,gas:'3000000'});

  ledTokenAddress = ledToken.options.address;

  contractUploadTime = moment.unix(Date.now());
  startTime = contractUploadTime.unix();
  endTime = contractUploadTime.add(31, 'days').unix();

  /*tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
  .send({from:fund,gas:'3000000'});

  tokenSaleAddress = tokenSale.options.address;*/

})

describe('Starting and Ending Period', async function() {

  it('should reject payments before start', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1600000000,1610000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.enableTransfers(true).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    

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
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.enableTransfers(true).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    

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
    await ledToken.methods.enableTransfers(true).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    

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

describe('Payments', async function() {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.enableTransfers(true).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    
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

    let tokenPriceInWei = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let amountOfTokens = (web3.utils.toWei('1','ether')/tokenPriceInWei)*(10**18);

    /*let expectedSupplyIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
    expectedSupplyIncrease = await baseUnits(ledToken, expectedSupplyIncrease)*/

    let totalSupply = await ledToken.methods.totalSupply().call();

    let supplyIncrease = (totalSupply - initialTotalSupply);
    let supplyBase = supplyIncrease/(10**18);

    let difference = Math.abs(supplyBase-amountOfTokens);
  })

  it('should increase total supply by 1250 for 1 ether raised', async function() {
    let initialTotalSupply = await ledToken.methods.totalSupply().call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let totalSupply = await ledToken.methods.totalSupply().call();
    let supplyIncrease = (totalSupply - initialTotalSupply);
    let supplyBase = supplyIncrease/(10**18);

    assert.equal(Math.floor(supplyBase),1250);
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

    let tokenPriceInWei = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let expectedBalanceIncrease = web3.utils.toWei('1','ether')/tokenPriceInWei;
    let balanceBase = balanceIncrease/(10**18);
    assert.equal(Math.floor(balanceBase),Math.floor(expectedBalanceIncrease));
  })

  it('should increase buyer balance by 1250 for 1 ether invested', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let balanceBase = balanceIncrease/(10**18);
    assert.equal(Math.floor(balanceBase), 1250);
  })
})

// Test commented out because of new bonus model

/*describe('Price', function () {

  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
  })

  it('should initially return 15% premium price', async function() {
    let price = await tokenSale.methods.getPriceInWei().call();
    let expectedPrice = 119000000000000;
    assert.equal(price,expectedPrice);
  })

  it('should return 10% premium price after 5% of the tokens have been bought', async function() {
    let basePriceInWei = await tokenSale.methods.BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let investment = 0.05 * capInWei;
    investment = BigNumber(investment);
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:investment,gas:'3000000'});

    let priceInWei = await tokenSale.methods.getPriceInWei().call();
    let expectedPrice = 126000000000000;
    assert.equal(priceInWei,expectedPrice);
  })

  it('should return 5% premium price after 15% of the tokens have been bought', async function() {
    let basePriceInWei = await tokenSale.methods.BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let investment = 0.15 * capInWei;
    investment = BigNumber(investment);

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:investment,gas:'3000000'});

    let priceInWei = await tokenSale.methods.getPriceInWei().call();
    let expectedPrice = 133000000000000;
    assert.equal(priceInWei,expectedPrice);
  })

  it('should return full price after 25% of the tokens have been sold', async function() {
    let basePriceInWei = await tokenSale.methods.BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let investment = 0.25 * capInWei;
    investment = BigNumber(investment);

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:investment,gas:'3000000'});

    let priceInWei = await tokenSale.methods.getPriceInWei().call();
    let expectedPrice = 140000000000000;
    assert.equal(priceInWei,expectedPrice);
  })
})*/

describe('Buying Tokens', async function() {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
  })

  it('should have a base token price of 800000000000000 wei',async function () {
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    assert.equal(basePrice, 800000000000000);
  })

  it('should offer a 5% bonus if more than 6.66 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('7','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.05), Math.floor(balanceBase));
  })

  it('should offer a 10% bonus if more than 13.33 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('14','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.10), Math.floor(balanceBase));
  })

  it('should offer a 15% bonus if more than 20 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('21','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.15), Math.floor(balanceBase));
  })

  it('should offer a 20% bonus if more than 26.66 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('27','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.20), Math.floor(balanceBase));
  })

  it('should offer a 25% bonus if more than 33.333 eth was put in', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(sender).call();
    let sendValue = web3.utils.toWei('34','ether');

    await tokenSale.methods.buyTokens(sender).send({from:sender,value:sendValue,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(sender).call();
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let basePrice = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let tokensWithoutBonus = sendValue/basePrice;
    let balanceBase = balanceIncrease/(10**18);
    assert.ok(tokensWithoutBonus<balanceBase);
    assert.equal(Math.floor(tokensWithoutBonus*1.25), Math.floor(balanceBase));
  })

  it('should throw if the number of tokens exceeds the cap', async function() {
    let basePriceInWei = await tokenSale.methods.ICO_BASE_PRICE_IN_WEI().call();
    let capInWei = await tokenSale.methods.weiCap().call();
    let initialBalance = await ledToken.methods.balanceOf(sender).call();

    let amount = 0.78 * capInWei * (1.001);
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:amount,gas:'3000000'});
      assert(false);
    } catch(error) {
      let balance = await ledToken.methods.balanceOf(sender).call();
      assert.equal(balance,initialBalance);
    }
  })

  it('should throw if the investment is more than 1000 ETH', async function() {
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1001', 'ether'),gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
  })
  it('should not throw if the investment is under 1000 ETH', async function() {
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('999.8', 'ether'),gas:'3000000'});
      assert(true);
    } catch(error) {
      assert(false);
    }
  })

  it('should throw if the investment is under 0.2 ETH', async function() {
    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('0.19', 'ether'),gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
  })

  it('should increase the number of contributors by 1', async function() {
    let initialContributors = await tokenSale.methods.contributors().call();
    await tokenSale.methods.buyTokens(sender).send({from:sender,value:web3.utils.toWei('1','ether'),gas:'3000000'});
    let contributors = await tokenSale.methods.contributors().call();
    assert(contributors>initialContributors);
  })
})

