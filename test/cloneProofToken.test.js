require('../scripts/jsHelpers.js')

const fs = require('fs')
const csv = require('csv-parser')
const json2csv = require('json2csv')
const ethereumAddress = require('ethereum-address')
const assert = require('assert')

const ganache = require('ganachi-cli')
const provider = ganache.provider()
const Web3 = require('web3')
const web3 = new Web3(provider)

const moment = require('moment')

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

const compiledLedToken = require('../contracts/build/LedToken.json')
const compiledTokenSale = require('../contracts/build/TokenSale.json')
const compiledTokenFactory = require('../contracts/build/TokenFactory.json')


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

let accounts

let oneEther

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();

  ledTokenFactory = await new web3.eth.Contract(JSON.parse(compiledTokenFactory.interface))
  .deploy({data:compiledTokenFactory.bytecode})
  .send({from:accounts[0],gas:'1000000'})
  ledTokenFactoryAddress = ledTokenFactory.options.address

  ledToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface))
  .deploy({data:compiledLedToken.bytecode,arguments:[ledTokenFactoryAddress,'0x0',0,'Led Token','PRFT']})
  .send({from:accounts[0],gas:'1000000'})

  ledTokenAddress = ledToken.options.address

  contractUploadTime = moment.latestTime() //
  startTime = contractUploadTime.add(1, 'day').unix() //
  endTime = contractUploadTime.add(1, 'day').unix() //

  tokenSale = new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
  .deploy({data:compiledTokenSale.bytecode,arguments:[ledTokenAddress,startTime,endTime]})
  .send({from:accounts[0],gas:'1000000'})

  tokenSaleAddress = tokenSale.options.address

  await ledToken.methods.transferControl(tokenSaleAddress)

  await increaseTime(moment.duration(1.01, 'day'))
  oneEther = web3.utils.toWei('1', 'ether')
})

describe('Cloning: ', function () {
  beforeEach(async function() {

    await tokenSale.methods.buyTokens().send({from:accounts[1],value:oneEther,gas:'1000000'})

    let txn = await ledToken.methods.createCloneToken(0, 'Led Token', 'PRFT2').send({from:accounts[0], gas:'1000000'})
    topics = getTxnReceiptTopics(txn)
    clonedTokenAddress = decodeEthereumAddress(topics[0].parameters[0])
    clonedToken = await new web3.eth.Contract(JSON.parse(compiledLedToken.interface),clonedTokenAddress)
  })

  it('token should be cloneable', async function () {
    let validAddress = ethereumAddress.isAddress(clonedTokenAddress)
    assert.ok(validAddress)
  })

  it('cloned token should return identical balances', async function() {
    let balance = await ledToken.methods.balanceOf(accounts[1]).call()
    let clonedBalance = await clonedToken.methods.balanceOf(accounts[1]).call()
    assert.equal(balance, clonedBalance)
  })

  it('should return identical total supply', async function() {
    let totalSupply = await ledToken.methods.totalSupply().call()
    let clonedTotalSupply = await clonedToken.methods.totalSupply().call()
    assert.equal(totalSupply, clonedTotalSupply)
  })

  it('should be pluggable and buyable via a new tokensale instance', async function() {

    let clonedTokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[clonedTokenAddress,startTime,endTime]})
    .send({from:accounts[0],gas:'1000000'})

    let clonedTokenSaleAddress = clonedTokenSale.options.address
    await clonedToken.methods.transferControl(clonedTokenSaleAddress).send({from:accounts[0],gas:'1000000'})

    let initialTokenBalance = await clonedToken.methods.balanceOf(accounts[2])

    await clonedTokenSale.methods.buyTokens().send({from:accounts[2],value:oneEther,gas:'1000000'})

    let tokenBalance = await clonedToken.methods.balanceOf(accounts[2])
    let balanceIncrease = (tokenBalance - initialTokenBalance)
    let decimals = await clonedToken.methods.decimals().call()
    balanceIncrease = (balanceIncrease/(10**decimals.toNumber()))
    assert(balanceIncrease>10)
  })

  it('cloned tokens should be transferable', async function() {

    let clonedTokenSale = await new web3.eth.Contract(JSON.parse(compiledTokenSale.interface))
    .deploy({data:compiledTokenSale.bytecode,arguments:[clonedTokenAddress,startTime,endTime]})
    .send({from:accounts[0],gas:'1000000'})

    let clonedTokenSaleAddress = clonedTokenSale.options.address
    await clonedToken.methods.transferControl(clonedTokenSaleAddress).send({from:accounts[0],gas:'1000000'})
    await clonedTokenSale.methods.enableTransfers(true).send({from:accounts[0],gas:'1000000'})
    let buyer1InitialBalance = await clonedToken.methods.balanceOf(accounts[1])
    let buyer2InitialBalance = await clonedToken.methods.balanceOf(accounts[2])

    await clonedToken.methods.transfer(accounts[2], 100).send({from:accounts[1],gas:'1000000'})

    let buyer1Balance = await getTokenBalance(clonedToken, buyer)
    let buyer2Balance = await getTokenBalance(clonedToken, buyer2)

    assert.equal(buyer1Balance, buyer1InitialBalance - 100)
    assert.equal(buyer2Balance, buyer2InitialBalance + 100)
  })
})
