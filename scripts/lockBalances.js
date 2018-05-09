module.exports = async function (callback) {

    require('babel-register')
    require('babel-polyfill')
    require('./jsHelpers.js')

    const Web3 = require('web3')
    const LedToken = artifacts.require('./LedToken.sol')
    const provider = artifacts.options.provider
    const web3 = new Web3(provider)
    const config = require('../config')

    let ledToken
    let sender

    web3.eth.getAccounts(function (error, result) {
        let sender = result[0]
        run(sender)
        callback()
    })

    const run = async function (sender) {
        ledToken = await LedToken.deployed()
        let txn = await ledToken.lockPresaleBalances({
            from: sender,
            gas: config.constants.DEFAULT_GAS,
            gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE
        })
    }
}

