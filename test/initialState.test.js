const assert = require('assert');

const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const compiledLedToken = require('../mastercontract/build/LedToken.json');
const compiledTokenSale = require('../mastercontract/build/TokenSale.json');

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

let ledMultiSig = '0x865e785f98b621c5fdde70821ca7cea9eeb77ef4';

beforeEach(async function() {

  accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  sender = accounts[1];
  ledWalletAddress = accounts[9];

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
  this.timeout(0);

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
