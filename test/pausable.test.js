const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const moment = require('moment');

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
let hacker1;
let wallet;
let ledWalletAddress;

let startTime;
let endTime;
let contractUploadTime;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
  hacker1 = accounts[3];
  wallet = accounts[5];
  ledWalletAddress = accounts[9];

  ledPresaleToken = await new web3.eth.Contract(JSON.parse(compiledLedPresaleToken.interface))
  .deploy({data:compiledLedPresaleToken.bytecode})
  .send({from:fund,gas:'3000000'});
  ledPresaleTokenAddress = ledPresaleToken.options.address;

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:['0x0','0x0',0,'Led Token Test','PRFT Test']})
  .send({from:fund,gas:'3000000'});

  ledTokenAddress = ledToken.options.address;

  contractUploadTime = moment.unix(Date.now());
  startTime = contractUploadTime.unix();
  endTime = contractUploadTime.add(31, 'days').unix();

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
  .send({from:fund,gas:'3000000'});

  tokenSaleAddress = tokenSale.options.address;
  await tokenSale.methods.whitelist(sender).send({from:fund,gas:'3000000'});
})

describe('Pause', function () {
  after(async function() {
    let crowdsalePaused = await tokenSale.methods.paused().call();
    let owner = await tokenSale.methods.owner().call();
    if (crowdsalePaused) {
      await tokenSale.methods.unpause().send({from:owner,gas:'3000000'});
    }
  })

  beforeEach(async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
  })

  it('can be paused and unpaused by the owner', async function() {
    let crowdsalePaused = await tokenSale.methods.paused().call();
    let owner = await tokenSale.methods.owner().call();

    if (crowdsalePaused) {
      await tokenSale.methods.unpause().send({from:owner,gas:'3000000'});
      crowdsalePaused = await tokenSale.methods.paused().call();
      assert.ok(!crowdsalePaused);
    }

    await tokenSale.methods.pause().send({from:owner,gas:'3000000'});
    crowdsalePaused = await tokenSale.methods.paused().call();
    assert.ok(crowdsalePaused);

    await tokenSale.methods.unpause().send({from:owner,gas:'3000000'});
    crowdsalePaused = await tokenSale.methods.paused().call();
    assert.ok(!crowdsalePaused);
  })

  it('can not be paused non-owner', async function() {
    let crowdsalePaused = await tokenSale.methods.paused().call();
    let owner = await tokenSale.methods.owner().call();

    // we initially unpause the contract before we carry out the test
    if (crowdsalePaused) {
      await tokenSale.methods.unpause().send({from:owner,gas:'3000000'});
      crowdsalePaused = await tokenSale.methods.paused().call();
      assert.ok(!crowdsalePaused);
    }
    try {
      await tokenSale.methods.pause().send({from:hacker1,gas:'3000000'});
      assert(false);
    } catch (error) {
      crowdsalePaused = await tokenSale.methods.paused().call();
      assert.ok(!crowdsalePaused);
    }
  })

  it('can not be unpaused non-owner', async function() {
    let crowdsalePaused = await tokenSale.methods.paused().call();
    let owner = await tokenSale.methods.owner().call();

    // we initially pause the contract before we carry out the test
    if (!crowdsalePaused) {
      await tokenSale.methods.pause().send({from:owner,gas:'3000000'});
      crowdsalePaused = await tokenSale.methods.paused().call();
      assert.ok(crowdsalePaused);
    }

    try {
      await tokenSale.methods.unpause().send({from:hacker1,gas:'3000000'});
      assert(false);
    } catch (error) {
      crowdsalePaused = await tokenSale.methods.paused().call();
      assert.ok(crowdsalePaused);
    }
  })

  it('buying tokens should not be possible if the contract is paused', async function() {
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    let initialBalance = await ledToken.methods.balanceOf(sender).call();

    // Force start due to unix timestamp differences.
    await tokenSale.methods.forceStart().send({from:fund,gas:'3000000'});

    try {
      await tokenSale.methods.buyTokens(sender).send({from:sender,gas:'3000000',value:web3.utils.toWei('1', 'ether')});
      assert(false);
    } catch(error) {
      let balance = await ledToken.methods.balanceOf(sender).call();
      assert.equal(balance,initialBalance);
    }
  })

  it('buying tokens should be possible if the contract is paused and unpaused', async function() {
    let initialBalance = await ledToken.methods.balanceOf(sender).call();

    // Force start due to unix timestamp differences.
    await tokenSale.methods.forceStart().send({from:fund,gas:'3000000'});

    await tokenSale.methods.buyTokens(sender).send({from:sender,gas:'3000000',value:web3.utils.toWei('1', 'ether')});
    await tokenSale.methods.pause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.unpause().send({from:fund,gas:'3000000'});
    await tokenSale.methods.buyTokens(sender).send({from:sender,gas:'3000000',value:web3.utils.toWei('1', 'ether')});

    let balance = await ledToken.methods.balanceOf(sender).call();
    assert.ok(balance>initialBalance);
  })
})

