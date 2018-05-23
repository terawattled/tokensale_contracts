const assert = require('assert');

const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const compiledLedToken = require('../contracts/build/LedToken.json');
const compiledTokenSale = require('../contracts/build/TokenSale.json');
const compiledLedPresaleToken = require('../contracts/build/LedPresaleToken.json');

const moment = require('moment');

let accounts;
let fund;
let tokenSale;
let tokenSaleAddress;
let ledToken;
let ledPresaleToken;
let ledPresaleTokenAddress;
let ledTokenAddress;
let sender;
let ledWalletAddress;

let startTime;
let endTime;
let contractUploadTime;

let ledMultiSig = '0x9c0e9941a4c554f6e1aa1930268a7c992e3c8602';

beforeEach(async function() {

  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
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
  endTime = contractUploadTime.add(7, 'days').unix();

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
  .send({from:fund,gas:'3000000'});

  tokenSaleAddress = tokenSale.options.address;
})

// it('should be ended only after end', async function() {
//   let ended = await tokenSale.hasEnded()
//   ended.should.equal(false)
// })

describe('Initial State', function () {

  beforeEach(async function() {
    await ledToken.methods.transferControl(tokenSaleAddress).send({from:fund,gas:'3000000'});
  })

  it('should initially set the multisig', async function() {
    let multisigUpper = await tokenSale.methods.ledMultiSig().call();
    let multisig = multisigUpper.toLowerCase();
    assert.equal(multisig,ledMultiSig);
  })

  it('should initially be linked to the Led token', async function() {
    let token = await tokenSale.methods.ledToken().call();
    assert.equal(token, ledTokenAddress);
  })

  // Repeat test

  /*it('Token base price should be equal to 0.000119 ether with the first discount', async function() {
    let priceWei = await tokenSale.methods.getPriceInWei().call();
    let price = (priceWei/10**18);
    let difference = Math.abs(price-(0.000119));
    assert.ok(difference<0.00001);
  })*/
})
