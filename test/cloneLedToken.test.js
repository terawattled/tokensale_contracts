require('../scripts/jsHelpers.js');

const fs = require('fs');
const csv = require('csv-parser');
const json2csv = require('json2csv');
const ethereumAddress = require('ethereum-address');
const assert = require('assert');

const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const moment = require('moment');

const {getTxnReceiptTopics, latestTime, increaseTime} = require('../scripts/helpers.js');
const {decodeEthereumAddress} = require('../scripts/utils.js');

const compiledLedToken = require('../contracts/build/LedToken.json');
const compiledTokenSale = require('../contracts/build/TokenSale.json');
const compiledTokenFactory = require('../contracts/build/TokenFactory.json');

let tokenSale;
let ledToken;
let ledTokenFactory;
let ledTokenFactoryAddress;

let ledTokenAddress;
let tokenSaleAddress;
let startTime;
let endTime;
let contractUploadTime;

let txnReceipt;
let topics;
let clonedTokenAddress;
let clonedToken;

let accounts;

let oneEther;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();

  ledTokenFactory = await new web3.eth.Contract(JSON.parse(compiledTokenFactory.interface))
  .deploy({data:compiledTokenFactory.bytecode})
  .send({from:accounts[0],gas:'3000000'});
  ledTokenFactoryAddress = ledTokenFactory.options.address;

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:[ledTokenFactoryAddress,'0x0',0,'Led Token','PRFT']})
  .send({from:accounts[0],gas:'3000000'});

  ledTokenAddress = ledToken.options.address;
  
  contractUploadTime = moment.unix(Date.now()); 
  startTime = contractUploadTime.unix();
  endTime = contractUploadTime.add(2, 'days').unix(); 

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
  .send({from:accounts[0],gas:'3000000'});

  tokenSaleAddress = tokenSale.options.address;

  await ledToken.methods.transferControl(tokenSaleAddress).send({from:accounts[0]});

  await increaseTime(moment.duration(1.01, 'days'));
})

describe('Cloning: ', function () {
  beforeEach(async function() {
    console.log('lets try');
    await tokenSale.methods.buyTokens(accounts[1]).send({
      from:accounts[1],
      value:web3.utils.toWei('1', 'ether'),
      gas:'3000000'
    });
    console.log('success');
    let txn = await ledToken.methods.createCloneToken(0, 'Led Token', 'PRFT2').send({from:accounts[0], gas:'3000000'});
    topics = getTxnReceiptTopics(txn);
    clonedTokenAddress = decodeEthereumAddress(topics[0].parameters[0]);
    clonedToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface),clonedTokenAddress);
  })

  it('token should be cloneable', async function () {
    let validAddress = ethereumAddress.isAddress(clonedTokenAddress);
    assert.ok(validAddress);
  })

  it('cloned token should return identical balances', async function() {
    let balance = await ledToken.methods.balanceOf(accounts[1]).call();
    let clonedBalance = await clonedToken.methods.balanceOf(accounts[1]).call();
    assert.equal(balance, clonedBalance);
  })

  it('should return identical total supply', async function() {
    let totalSupply = await ledToken.methods.totalSupply().call();
    let clonedTotalSupply = await clonedToken.methods.totalSupply().call();
    assert.equal(totalSupply, clonedTotalSupply);
  })

  it('should be pluggable and buyable via a new tokensale instance', async function() {

    let clonedTokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[clonedTokenAddress,startTime,endTime]})
    .send({from:accounts[0],gas:'3000000'});

    let clonedTokenSaleAddress = clonedTokenSale.options.address;
    await clonedToken.methods.transferControl(clonedTokenSaleAddress).send({from:accounts[0],gas:'3000000'});

    let initialTokenBalance = await clonedToken.methods.balanceOf(accounts[2]);

    await clonedTokenSale.methods.buyTokens(accounts[2]).send({from:accounts[2],value:web3.utils.toWei('1', 'ether'),gas:'3000000'});

    let tokenBalance = await clonedToken.methods.balanceOf(accounts[2]);
    let balanceIncrease = (tokenBalance - initialTokenBalance);
    let decimals = await clonedToken.methods.decimals().call();
    balanceIncrease = (balanceIncrease/(10**decimals.toNumber()));
    assert(balanceIncrease>10);
  })

  it('cloned tokens should be transferable', async function() {

    let clonedTokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[clonedTokenAddress,startTime,endTime]})
    .send({from:accounts[0],gas:'3000000'});

    let clonedTokenSaleAddress = clonedTokenSale.options.address;
    await clonedToken.methods.transferControl(clonedTokenSaleAddress).send({from:accounts[0],gas:'3000000'});
    await clonedTokenSale.methods.enableTransfers(true).send({from:accounts[0],gas:'3000000'});
    let buyer1InitialBalance = await clonedToken.methods.balanceOf(accounts[1]);
    let buyer2InitialBalance = await clonedToken.methods.balanceOf(accounts[2]);

    await clonedToken.methods.transfer(accounts[2], 100).send({from:accounts[1],gas:'3000000'});

    let buyer1Balance = await getTokenBalance(clonedToken, buyer);
    let buyer2Balance = await getTokenBalance(clonedToken, buyer2);

    assert.equal(buyer1Balance, buyer1InitialBalance - 100);
    assert.equal(buyer2Balance, buyer2InitialBalance + 100);
  })
})
