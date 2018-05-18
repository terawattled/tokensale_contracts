const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { getAddress,
         expectInvalidOpcode } from '../scripts/helpers.js'

import { transferOwnership } from '../scripts/ownershipHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const LedPresaleToken = artifacts.require('./LedPresaleToken.sol')
const LedToken = artifacts.require('./LedToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

const ganache = require('ganachi-cli')
const provider = ganache.provider()
const Web3 = require('web3')
const web3 = new Web3(provider)

const compiledLedToken = require('../build/contracts/LedToken.json')
const compiledTokenSale = require('../build/contracts/TokenSale.json')
const compiledLedPresaleToken = require('../build/contracts/LedPresaleToken.json')

beforeEach(async function(){
  let accounts
  accounts = await web3.eth.getAccounts();
  let fund = accounts[0]
  let tokenSale
  let ledToken
  let ledPresaleToken
  let ledPresaleTokenAddress
  let ledTokenAddress
  let receiver = accounts[2]
  let hacker1 = accounts[3]
  let hacker2 = accounts[4]
  let wallet = accounts[5]
  let ledWalletAddress = accounts[9]

  let startBlock
  let endBlock

  startBlock = web3.eth.blockNumber + 10
  endBlock = web3.eth.blockNumber + 20

  ledPresaleToken = await new web3.eth.Contract(JSON.parse(compiledLedPresaleToken))
  .deploy({data:compiledLedPresaleToken.bytecode})
  .send({from:fund})
  ledPresaleTokenAddress = ledPresaleToken.options.address

  // ledPresaleToken = await LedPresaleToken.new()
  // ledPresaleTokenAddress = await getAddress(ledPresaleToken)

  /*ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken))
  .deploy({data:compiledLedToken.bytecode,arguments:[ledPresaleTokenAddress, ledWalletAddress]})
  .send({from:fund})
  unsure about this*/

  // ledToken = await LedToken.new(ledPresaleTokenAddress, ledWalletAddress)
  // ledTokenAddress = await getAddress(ledToken)

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken))
  .deploy({data:compiledLedToken.bytecode,arguments:['0x0','0x0',0,'Led Token',18,'PRFT',true]})
  .send({from:fund})
  ledTokenAddress = ledToken.options.address

  // ledToken = await LedToken.new(
  //   '0x0',
  //   '0x0',
  //   0,
  //   'Led Token',
  //   18,
  //   'PRFT',
  //   true)

  tokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startBlock,endBlock]})

  // tokenSale = await TokenSale.new(
  //   ledTokenAddress,
  //   startBlock,
  //   endBlock)
})

  /*beforeEach(async function() {

    startBlock = web3.eth.blockNumber + 10
    endBlock = web3.eth.blockNumber + 20

    ledPresaleToken = await LedPresaleToken.new()
    ledPresaleTokenAddress = await getAddress(ledPresaleToken)

    ledToken = await LedToken.new(ledPresaleTokenAddress, ledWalletAddress)
    ledTokenAddress = await getAddress(ledToken)

    ledToken = await LedToken.new(
      '0x0',
      '0x0',
      0,
      'Led Token',
      18,
      'PRFT',
      true)

    tokenSale = await TokenSale.new(
      ledTokenAddress,
      startBlock,
      endBlock)
  })*/

describe('Ownership', function () {
  it('should initially belong to contract caller', async function() {
    let owner = await tokenSale.methods.owner().call()
    assert.equal(owner, fund)
  })

  it('should be transferable to another account', async function() {
    let owner = await tokenSale.methods.owner().call()
    await tokenSale.methods.transferOwnership(receiver).send({from:fund,gas:'1000000'})
    let newOwner = await tokenSale.methods.owner().call()
    assert.equal(newOwner, receiver)
  })

  it('should not be transferable by non-owner', async function() {
    let owner = await tokenSale.methods.owner().call()
    try {
      await tokenSale.methods.transferOwnership(hacker2).send({from:hacker1,gas:'1000000'})
    } catch (error) {
      console.log(error.message)
    }
    // await expectInvalidOpcode(transferOwnership(tokenSale, hacker1, hacker2))
    const newOwner = await tokenSale.methods.owner().call()
    assert.equal(owner, newOwner)
  })
})
