module.exports = async function (callback) {

    require('babel-register')
    require('babel-polyfill')
    require('./jsHelpers.js')

    const Web3 = require('web3')
    const provider = artifacts.options.provider
    const web3 = new Web3(provider)

    const LedToken = artifacts.require('./LedToken.sol')
    const TokenSale = artifacts.require('./TokenSale.sol')

    const ledToken = await LedToken.deployed()
    const ledTokenSale = await TokenSale.deployed()

    let tokenEvents = ledToken.allEvents({fromBlock: 1047310, toBlock: 'latest'})
    let tokenSaleEvents = ledTokenSale.allEvents({fromBlock: 0, toBlock: 'latest'})

    tokenEvents.watch((err, res) => {
        console.log("\n****************\n")
        console.log(res)
        console.log("\n****************\n")
    })

    tokenSaleEvents.watch((err, res) => {
        console.log("\n****************\n")
        console.log(res)
        console.log("\n****************\n")
    })

    callback()
}