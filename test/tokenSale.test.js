const ganache = require('ganache-cli');
const provider = ganache.provider();
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
const compiledTokenSale = require('../contracts/build/TokenSale.json');
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

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1600000000]})
  .send({from:fund,gas:'3000000'});

  tokenSaleAddress = tokenSale.options.address;
})

describe('Token Information', async function() {
  beforeEach(async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
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

describe('Finalized state', function () {
  beforeEach(async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
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
    await tokenSale.methods.allocateLedTokens().send({from:fund,gas:'3000000'});
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

  it('should allocate the surplus tokens to the LED team after finishing', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.finalize().send({from:fund,gas:'3000000'});
    let teamAddress = await tokenSale.methods.ledMultiSig.call();
    let teamBalance = await ledToken.methods.balanceOf(teamAddress).call();
    assert.ok(teamBalance>0);
  })
  
})
