require('babel-register');
require('babel-polyfill');
require('../scripts/jsHelpers.js');

const fs = require('fs');
const csv = require('csv-parser');

const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const moment = require('moment');

const assert = require('assert');

const compiledLedToken = require('../contracts/build/LedToken.json');
const compiledTokenSale = require('../contracts/build/TokenSale.json');

let accounts;
let tokenSale;
let tokenSaleAddress;
let ledToken;
let ledTokenAddress;

let fund;
let sender;
let receiver;
let hacker;
let wallet;

let startTime;
let endTime;
let contractUploadTime;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
  receiver = accounts[2];
  hacker = accounts[3];
  wallet = accounts[4];

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:['0x0','0x0',0,'Led Token','PRFT']})
  .send({from:fund,gas:'3000000'});
  ledTokenAddress = ledToken.options.address;

  contractUploadTime = moment.unix(Date.now());
  startTime = contractUploadTime.unix();
  endTime = contractUploadTime.add(31, 'days').unix();

})

describe('Initial State', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
  })

  it('should initially be controlled by the token sale contract', async function() {
    let ledTokenOwner = await ledToken.methods.controller().call();
    assert.equal(ledTokenOwner,tokenSaleAddress);
  })

  it('should have 18 decimals', async function() {
    let decimals = await ledToken.methods.decimals().call();
    assert.equal(decimals,18);
  })

  it('should have Led Token Name', async function() {
    let name = await ledToken.methods.name().call();
    assert.equal('Led Token',name);
  })

  it('should have PRFT symbol', async function() {
    let symbol = await ledToken.methods.symbol().call();
    assert.equal(symbol,'PRFT');
  })
})

describe('Import balances', function () {
  this.timeout(0);
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
  })
  it('should correctly import a few balances', async function() {
    let addresses = [sender, receiver]
    let balances = [100, 100]
    await ledToken.methods.importPresaleBalances(addresses, balances).send({from:fund,gas:'3000000'});

    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    assert.equal(senderBalance,100);
    assert.equal(receiverBalance,100);
  })

  it('should correctly import balances from a CSV file', async function() {
    let addresses = [];
    let balances = [];

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./test/balances.csv')
        .pipe(csv())
        .on('data', function (data) {
          addresses.push(data['address'])
          balances.push(data['balance'])
        })
        .on('end', resolve)
    });

    await writeData;
    balances = balances.toNumber();

    let addressListNumber = addresses.length;

    for (let i = 0; i < addressListNumber; i = i + 25) {
      let addressesBatch = addresses.slice(i, i + 25);
      let balancesBatch = balances.slice(i, i + 25);
      await ledToken.methods.importPresaleBalances(addressesBatch, balancesBatch).send({from:fund,gas:'3000000'});
    }

    for (let i = 0; i < 10; i++) {
      let balance = await ledToken.methods.balanceOf(addresses[i]).call();
      assert.equal(balance,balances[i]);
    }
  })

  it('have a total supply equal to the sum of the presale balances and led tokens after importing', async function() {
    let addresses = [];
    let balances = [];

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./test/balances.csv')
        .pipe(csv())
        .on('data', function (data) {
          addresses.push(data['address'])
          balances.push(data['balance'])
        })
        .on('end', resolve)
    });

    await writeData;
    balances = balances.toNumber();

    let addressListNumber = addresses.length;

    for (let i = 0; i < addressListNumber; i = i + 25) {
      let addressesBatch = addresses.slice(i, i + 25);
      let balancesBatch = balances.slice(i, i + 25);
      await ledToken.methods.importPresaleBalances(addressesBatch, balancesBatch).send({from:fund,gas:'3000000'});
    }

    let expectedSupply = balances.sum();
    let supply = await ledToken.methods.totalSupply().call();
    assert.equal(supply, expectedSupply);
  })

  it('should not import balances if caller is not the owner of the contract', async function() {
    let addresses = [];
    let balances = [];

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./test/balances.csv')
        .pipe(csv())
        .on('data', function (data) {
          addresses.push(data['address'])
          balances.push(data['balance'])
        })
        .on('end', resolve)
    });

    await writeData;
    balances = balances.toNumber();
    try {
      await ledToken.methods.importPresaleBalances(addresses, balances).send({from:hacker,gas:'3000000'});
      assert(false);
    } catch (error) {
      assert(true);
    }

  })

  it('can lock the presale balances', async function() {
    let tx = await ledToken.methods.lockPresaleBalances().send({from:fund,gas:'3000000'});
    if (tx) {
      let balancesLocked = await ledToken.methods.presaleBalancesLocked().call();
      assert(balancesLocked);
    } else {
      assert(false);
    }
  })

  it('can not import presale balances after the presale balances are locked', async function () {
    let tx = await ledToken.methods.lockPresaleBalances().send({from:fund,gas:'3000000'});
    if (tx) {
      let addresses = [hacker];
      let balances = [100];
      try {
        await ledToken.methods.importPresaleBalances(addresses, balances).send({from:fund,gas:'3000000'});
        assert(false);
      } catch (error) {
        let balance = await ledToken.methods.balanceOf(hacker).call();
        assert.equal(balance,0);
      }
    } else {
      assert(false);
    }
  })
})

describe('Minting', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
  })
  it('should be mintable by owner contract', async function() {
    let initialTokenBalance = await ledToken.methods.balanceOf(receiver).call();
    await ledToken.methods.mint(receiver, 100).send({from:fund,gas:'3000000'});

    let tokenBalance = await ledToken.methods.balanceOf(receiver).call();
    let balanceIncrease = tokenBalance - initialTokenBalance;

    assert.equal(balanceIncrease, 100);
  })

  it('should be mintable', async function() {
    let mintingFinished = await ledToken.methods.mintingFinished().call();
    assert(!mintingFinished);
  })

  it('should not be mintable by non-owner', async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    let initialTokenBalance = await ledToken.methods.balanceOf(receiver).call();

    try {
      await ledToken.methods.mint(receiver, 100).send({from:hacker,gas:'3000000'});
      assert(false);
    } catch (error) {

      let tokenBalance = await ledToken.methods.balanceOf(receiver).call();
      let balanceIncrease = tokenBalance - initialTokenBalance;
  
      assert.equal(balanceIncrease,0);
    }
  })

  it('can not be stopped by non-owner', async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    try {
      await ledToken.methods.finishMinting().send({from:hacker,gas:'3000000'});
      assert(false);
    } catch (error) {
      let mintingFinished = await ledToken.methods.mintingFinished().call();
      assert(!mintingFinished);
    }
  })
})

describe('Transfers', function () {

  it('should be transferable', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
    let initialSenderBalance = await ledToken.methods.balanceOf(sender).call();
    let initialReceiverBalance = await ledToken.methods.balanceOf(receiver).call();

    await ledToken.methods.transfer(receiver, 10000).send({from:sender,gas:'3000000'});

    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    let senderBalanceVariation = senderBalance - initialSenderBalance;
    let receiverBalanceVariation = receiverBalance - initialReceiverBalance;

    assert.equal(senderBalanceVariation,-10000);
    assert.equal(receiverBalanceVariation,10000);
  })

  it('should not allow to transfer more than balance', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
    try {
      await ledToken.methods.transfer(receiver, 10001).send({from:sender,gas:'3000000'});
      assert(false);
    } catch (error) {
      assert(true);
    }
  })

  it('tokens should not be transferable to the token contract (by mistake)', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
    try {
      await ledToken.methods.transfer(ledTokenAddress, 1000).send({from:sender,gas:'3000000'});
      assert(false);
    } catch (error) {
      assert(true);
    }
  })

  it('tokens should not be transferable if transfers are locked', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    let initialSenderBalance = await ledToken.methods.balanceOf(sender).call();
    let initialReceiverBalance = await ledToken.methods.balanceOf(receiver).call();

    try {
      await ledToken.methods.transfer(receiver, 1000).send({from:sender,gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    assert.equal(senderBalance, initialSenderBalance);
    assert.equal(receiverBalance, initialReceiverBalance);
  })

  it('transfers can be enabled after the tokensale ends', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1520000020]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});

    let initialSenderBalance = await ledToken.methods.balanceOf(sender).call();
    let initialReceiverBalance = await ledToken.methods.balanceOf(receiver).call();

    await ledToken.methods.transfer(receiver, 1000).send({from:sender,gas:'3000000'});

    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    assert.equal(senderBalance,initialSenderBalance-1000);
    assert.equal(receiverBalance,1000);
  })

  it('transfers can be enabled by controller before the tokensale ends', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});

    let initialSenderBalance = await ledToken.methods.balanceOf(sender).call();
    let initialReceiverBalance = await ledToken.methods.balanceOf(receiver).call();

    await ledToken.methods.transfer(receiver, 1000).send({from:sender,gas:'3000000'});

    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    assert.equal(senderBalance,initialSenderBalance-1000);
    assert.equal(receiverBalance,1000);
  })

  it('transfers can not be enabled by non-controller before the tokensale ends', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});

    try {
      await tokenSale.methods.enableTransfers().send({from:sender,gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
  })

  it('transfers can be enabled by anyone after the tokensale ends', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1520000020]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:receiver,gas:'3000000'});

    let initialSenderBalance = await ledToken.methods.balanceOf(sender).call();
    let initialReceiverBalance = await ledToken.methods.balanceOf(receiver).call();

    await ledToken.methods.transfer(receiver, 1000).send({from:sender,gas:'3000000'});

    let senderBalance = await ledToken.methods.balanceOf(sender).call();
    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();

    assert.equal(senderBalance,initialSenderBalance-1000);
    assert.equal(receiverBalance,1000);
  })

  it('transfers can not be locked after the tokensale ends', async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,1520000000,1520000020]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:receiver,gas:'3000000'});
    try {
      await tokenSale.methods.lockTransfers().send({from:sender,gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
  })
})

describe('Balances: ', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
  })

  it('balanceOf should return the proper token holder balance', async function() {
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    let balance = await ledToken.methods.balanceOf(sender).call();
    assert.equal(balance, 10000);
  })

  it('balanceOfAt should return token holder balance at a previous block', async function() {
    let initialBlock = await web3.eth.getBlockNumber();
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    let currentBlock = await web3.eth.getBlockNumber();

    let initialBalance = await ledToken.methods.balanceOfAt(sender, initialBlock).call();
    let currentBalance = await ledToken.methods.balanceOfAt(sender, currentBlock).call();

    assert.equal(initialBalance,0);
    assert.equal(currentBalance,10000);
  })
})

describe('Total Supply: ', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;
  })
  it('totalSupply should be increase when new tokens are created', async function() {
    let initialSupply = await ledToken.methods.totalSupply().call();
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});

    let supply = await ledToken.methods.totalSupply().call();
    let supplyIncrease = supply - initialSupply;
    assert.equal(supplyIncrease,10000);
  })

  it('totalSupplyAt should correctly record total supply checkpoints', async function() {
    let firstBlock = await web3.eth.getBlockNumber();
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    let secondBlock = await web3.eth.getBlockNumber();
    await ledToken.methods.mint(sender, 10000).send({from:fund,gas:'3000000'});
    let thirdBlock = await web3.eth.getBlockNumber();

    let firstTotalSupply = await ledToken.methods.totalSupplyAt(firstBlock).call();
    let secondTotalSupply = await ledToken.methods.totalSupplyAt(secondBlock).call();
    let thirdTotalSupply = await ledToken.methods.totalSupplyAt(thirdBlock).call();

    assert.equal(firstTotalSupply,0);
    assert.equal(secondTotalSupply,10000);
    assert.equal(thirdTotalSupply,20000);
  })
})

describe('transferFrom: ', function () {
  beforeEach(async function() {
    tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:fund,gas:'3000000'});
    tokenSaleAddress = tokenSale.options.address;

    await ledToken.methods.mint(sender, 1000).send({from:fund,gas:'3000000'});
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
    await tokenSale.methods.enableTransfers().send({from:fund,gas:'3000000'});
  })

  it('should throw if no allowance has been given', async function() {
    try {
      await ledToken.methods.transferFrom(sender,receiver,1000).send({from:fund,gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }
  })

  it('should return correct allowance balance after approve call', async function() {
    await ledToken.methods.approve(receiver,1000).send({from:sender,gas:'3000000'});

    let allowance = await ledToken.methods.allowance(sender,receiver).call();
    assert.equal(allowance,1000);
  })

  it('should allow transfer if amount is lower than allowance', async function() {
    await ledToken.methods.approve(receiver,1000).send({from:sender,gas:'3000000'});
    await ledToken.methods.transferFrom(sender,receiver,1000).send({from:receiver,gas:'3000000'});

    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();
    let senderBalance = await ledToken.methods.balanceOf(sender).call();

    assert.equal(receiverBalance,1000);
    assert.equal(senderBalance,0);
  })

  it('should return an exception if amount is higher than allowance', async function() {
    await ledToken.methods.approve(receiver,500).send({from:sender,gas:'3000000'});
    try {
      await ledToken.methods.transferFrom(sender,receiver,1000).send({from:receiver,gas:'3000000'});
      assert(false);
    } catch(error) {
      assert(true);
    }

    let receiverBalance = await ledToken.methods.balanceOf(receiver).call();
    let senderBalance = await ledToken.methods.balanceOf(sender).call();

    assert.equal(receiverBalance,0);
    assert.equal(senderBalance,1000);
  })

})
