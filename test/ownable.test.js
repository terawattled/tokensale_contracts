const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);

const assert = require('assert');

const compiledLedToken = require('../mastercontract/build/LedToken.json');
const compiledTokenSale = require('../mastercontract/build/TokenSale.json');

let tokenSale;
let fund;
let receiver;
let hacker1;
let hacker2;
let wallet;
let ledWalletAddress;

beforeEach(async function(){
  let accounts = await web3.eth.getAccounts();
  fund = accounts[0];
  let ledToken;
  let ledPresaleToken;
  let ledPresaleTokenAddress;
  let ledTokenAddress;
  receiver = accounts[2];
  hacker1 = accounts[3];
  hacker2 = accounts[4];
  wallet = accounts[5];
  ledWalletAddress = accounts[9];

  let blockNumber = await web3.eth.getBlockNumber();

  let startBlock = blockNumber + 10;
  let endBlock = blockNumber + 20;
  
  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:[ledPresaleTokenAddress,ledWalletAddress,0,'Led Token','LED']})
  .send({from:fund, gas:'3000000'});
  ledTokenAddress = ledToken.options.address;

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress, startBlock, endBlock]})
  .send({from:fund, gas:'3000000'});

})

describe('Ownership', function () {
  it('should initially belong to contract caller', async function() {
    let owner = await tokenSale.methods.owner().call();
    assert.equal(owner, fund);
  })

  it('should be transferable to another account', async function() {
    let owner = await tokenSale.methods.owner().call();
    await tokenSale.methods.transferOwnership(receiver).send({from:fund,gas:'3000000'});
    let newOwner = await tokenSale.methods.owner().call();
    assert.equal(newOwner, receiver);
  })

  it('should not be transferable by non-owner', async function() {
    let owner = await tokenSale.methods.owner().call();
    try {
      await tokenSale.methods.transferOwnership(hacker2).send({from:hacker1,gas:'3000000'});
    } catch (error) {
      
    }
    // await expectInvalidOpcode(transferOwnership(tokenSale, hacker1, hacker2))
    const newOwner = await tokenSale.methods.owner().call();
    assert.equal(owner, newOwner);
  })
})
