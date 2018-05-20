require('../scripts/jsHelpers.js')

const fs = require('fs')
const csv = require('csv-parser')
const json2csv = require('json2csv')
const ethereumAddress = require('ethereum-address')

const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

const ganache = require('ganachi-cli')
const provider = ganache.provider()
const Web3 = require('web3')
const web3 = new Web3(provider)

import moment from 'moment'

import {
  ether
} from '../scripts/testConfig.js'

import {
  getAddress,
  getTxnReceiptTopics,
  latestTime,
  increaseTime
} from '../scripts/helpers.js'

import {
  cloneToken,
  getTokenBalance,
  getTotalSupply,
  transferToken,
  baseUnits
} from '../scripts/tokenHelpers.js'

import {
  buyTokens,
  enableTransfers
} from '../scripts/tokenSaleHelpers.js'

import {
  transferControl
} from '../scripts/controlHelpers.js'

import {
  decodeEthereumAddress
} from '../scripts/utils.js'
import { METHODS } from 'http';

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const LedToken = artifacts.require('./LedToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')
const TokenFactory = artifacts.require('./TokenFactory.sol')

const compiledLedToken = require('../build/contracts/LedToken.json')
const compiledTokenSale = require('../build/contracts/TokenSale.json')
const compiledTokenFactory = require('../build/contracts/TokenFactory.json')


let tokenSale
let ledToken
let ledTokenFactory
let ledTokenFactoryAddress

let ledTokenAddress
let tokenSaleAddress
let startTime
let endTime
let contractUploadTime

let txnReceipt
let topics
let clonedTokenAddress
let clonedToken

  beforeEach(async function() {
    accounts = await web3.eth.getAccounts();

    ledTokenFactory = await new web3.eth.Contract(JSON.parse(compiledTokenFactory.interface))
    .deploy({data:compiledTokenFactory.bytecode})
    .send({from:accounts[0],gas:'1000000'})
    ledTokenFactoryAddress = ledTokenFactory.options.address

    ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken))
    .deploy({data:compiledLedToken.bytecode,arguments:[ledTokenFactoryAddress,'0x0',0,'Led Token','PRFT']})
    .send({from:accounts[0],gas:'1000000'})

    ledTokenAddress = ledToken.options.address

    contractUploadTime = latestTime() //
    startTime = contractUploadTime.add(1, 'day').unix() //
    endTime = contractUploadTime.add(1, 'day').unix() //

    tokenSale = new web3.eth.Contract(JSON.parse(compiledTokenSale))
    .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
    .send({from:accounts[0],gas:'1000000'})

    tokenSaleAddress = tokenSale.options.address

    await ledToken.methods.transferControl(tokenSaleAddress)

    await increaseTime(moment.duration(1.01, 'day'))
  })

  describe('Cloning: ', function () {
    beforeEach(async function() {

      let config = {
        name: 'Led Token',
        symbol: 'PRFT2',
        block: 0
      }

      await tokenSale.methods.buyTokens(buyer)

      txnReceipt = await cloneToken(ledToken, fund, config)
      topics = getTxnReceiptTopics(txnReceipt)
      clonedTokenAddress = decodeEthereumAddress(topics[0].parameters[0])
      clonedToken = await LedToken.at(clonedTokenAddress)
    })

    it('token should be cloneable', async function () {
      let validAddress = ethereumAddress.isAddress(clonedTokenAddress)
      validAddress.should.be.true
    })

    it('cloned token should return identical balances', async function() {
      let balance = await getTokenBalance(ledToken, buyer)
      let clonedBalance = await getTokenBalance(clonedToken, buyer)
      clonedBalance.should.be.equal(balance)
    })

    it('should return identical total supply', async function() {
      let totalSupply = await getTotalSupply(ledToken)
      let clonedTotalSupply = await getTotalSupply(clonedToken)
      clonedTotalSupply.should.be.equal(totalSupply)
    })

    it('should be pluggable and buyable via a new tokensale instance', async function() {

      let clonedTokenSale = await TokenSale.new(
        clonedTokenAddress,
        startTime,
        endTime
      )

      let clonedTokenSaleAddress = await getAddress(clonedTokenSale)
      await transferControl(clonedToken, fund, clonedTokenSaleAddress)

      let initialTokenBalance = await getTokenBalance(clonedToken, buyer2)
      await buyTokens(clonedTokenSale, buyer2, 1 * ether)

      let tokenBalance = await getTokenBalance(clonedToken, buyer2)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(clonedToken, balanceIncrease)
      expect(balanceIncrease).almost.equal(13.3689839572)
    })

    it('cloned tokens should be transferable', async function() {

      let clonedTokenSale = await TokenSale.new(
        clonedTokenAddress,
        startTime,
        endTime
      )

      let clonedTokenSaleAddress = await getAddress(clonedTokenSale)
      await transferControl(clonedToken, fund, clonedTokenSaleAddress)
      await enableTransfers(clonedTokenSale, fund)
      let buyer1InitialBalance = await getTokenBalance(clonedToken, buyer)
      let buyer2InitialBalance = await getTokenBalance(clonedToken, buyer2)

      await transferToken(clonedToken, buyer, buyer2, 100)

      let buyer1Balance = await getTokenBalance(clonedToken, buyer)
      let buyer2Balance = await getTokenBalance(clonedToken, buyer2)

      buyer1Balance.should.be.equal(buyer1InitialBalance - 100)
      buyer2Balance.should.be.equal(buyer2InitialBalance + 100)
    })
  })
