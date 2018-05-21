const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { TOKENS_ALLOCATED_TO_LED } from '../scripts/testConfig.js'
import { getAddress, latestTime } from '../scripts/helpers.js'
import { baseUnits, mintToken } from '../scripts/tokenHelpers.js'
import { transferOwnership } from '../scripts/ownershipHelpers.js'
import { transferControl } from '../scripts/controlHelpers.js'
import { getPrice } from '../scripts/tokenSaleHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const LedPresaleToken = artifacts.require('./LedPresaleToken.sol')
const LedToken = artifacts.require('./LedToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('Crowdsale', (accounts) => {
  let fund = accounts[0]
  let tokenSale
  let tokenSaleAddress
  let ledToken
  let ledPresaleToken
  let ledPresaleTokenAddress
  let ledTokenAddress
  let sender = accounts[1]
  let ledWalletAddress = accounts[9]

  let startTime
  let endTime
  let contractUploadTime

  let ledMultiSig = '0x9c0e9941a4c554f6e1aa1930268a7c992e3c8602'

  beforeEach(async function() {

    ledPresaleToken = await LedPresaleToken.new()
    ledPresaleTokenAddress = await getAddress(ledPresaleToken)

    ledToken = await LedToken.new(
      '0x0',
      '0x0',
      0,
      'Led Token Test',
      'PRFT Test'
    )

    ledTokenAddress = await getAddress(ledToken)

    contractUploadTime = latestTime()
    startTime = contractUploadTime.add(1, 'day').unix()
    endTime = contractUploadTime.add(31, 'day').unix()


    tokenSale = await TokenSale.new(
      ledTokenAddress,
      startTime,
      endTime)

    tokenSaleAddress = await getAddress(tokenSale)
  })

  // it('should be ended only after end', async function() {
  //   let ended = await tokenSale.hasEnded()
  //   ended.should.equal(false)
  // })

  describe('Initial State', function () {

    beforeEach(async function() {
      transferControl(ledToken, fund, tokenSaleAddress)
    })

    it('should initially set the multisig', async function() {
      let multisig = await tokenSale.ledMultiSig.call()
      multisig.should.be.equal(ledMultiSig)
    })

    it('should initially be linked to the Led token', async function() {
      let token = await tokenSale.ledToken.call()
      token.should.be.equal(ledTokenAddress)
    })

    it('Token base price should be equal to 0.0748 ether', async function() {
      let price = await getPrice(tokenSale)
      expect(price).almost.equal(0.85 * 0.088)
    })
  })
})
