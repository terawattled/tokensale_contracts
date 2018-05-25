var config = require('./config')

require('babel-register')
require('babel-polyfill')

const LightWalletProvider = require('@digix/truffle-lightwallet-provider')
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "gadget correct bargain begin abstract legend female accident door any nature build"; // 12 word mnemonic
module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*',
            gas: config.constants.MAX_GAS,
            from: '0x1219b0010d1170b2a194543d3dff5c9e7cfade2f'  // testprc main account here
        },
        ethereum: {
            provider: new LightWalletProvider({
                keystore: '/Users/davidvanisacker/.sigmate/sigmate-v3-tokensale-mainnet.json',
                password: 'popcorn123!',
                rpcUrl: config.infura.ethereum
            }),
            network_id: '1',
            gas: config.constants.MAX_GAS,
            gasPrice: config.constants.DEFAULT_GAS_PRICE
        },
        ropsten: {
            provider: new LightWalletProvider({
                keystore: '/Users/davidvanisacker/.sigmate/sigmate-v3-tokensale-ropsten.json',
                password: 'popcorn123!',
                rpcUrl: config.infura.ropsten
            }),
            network_id: '3'
        },
        rinkeby: {
            provider: new HDWalletProvider(mnemonic, config.infura.rinkeby),
            network_id: '4'
        }
    },
    solc: {
        optimizer: {
          enabled: true,
          runs: 200
        }
    }
}
