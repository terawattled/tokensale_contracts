let config = {
  infura: {
    ethereum: 'https://mainnet.infura.io/LYT8oOCNelziQUTO4HE2 ',
    ropsten: 'https://ropsten.infura.io/LYT8oOCNelziQUTO4HE2',
    rinkeby: 'https://rinkeby.infura.io/LYT8oOCNelziQUTO4HE2',
    kovan: 'https://kovan.infura.io/LYT8oOCNelziQUTO4HE2'
  },
  constants: {
    DEFAULT_GAS: 3 * 10 ** 6,
    MAX_GAS: 7 * 10 ** 6,
    DEFAULT_LOW_GAS_PRICE: 0.1 * 10 ** 9,
    DEFAULT_GAS_PRICE: 1 * 10 ** 9,
    DEFAULT_HIGH_GAS_PRICE: 5 * 10 ** 9,
    TOKENS_ALLOCATED_TO_LED: 1181031 * (10 ** 18),
    DECIMALS_POINTS: 10 ** 18,
    TOKEN_UNITS: 10 ** 18,
    START_TIMESTAMP: 1525780800,
    END_TIMESTAMP: 1528459200,
  },
  addresses: {
    development: {
      WALLET_ADDRESS: '0x1219b0010d1170b2a194543d3dff5c9e7cfade2f',
      TOKEN_WALLET_ADDRESS: '0x1219b0010d1170b2a194543d3dff5c9e7cfade2f'
    },
    rinkeby: {
      WALLET_ADDRESS: '0xa3af38500C37C4C05B1CE5c417dCf8f103fCC6f4',
      TOKEN_WALLET_ADDRESS: '0xa3af38500C37C4C05B1CE5c417dCf8f103fCC6f4'
    },
    ropsten: {
      WALLET_ADDRESS: '',
      TOKEN_WALLET_ADDRESS: ''
    },
    ethereum: {
      WALLET_ADDRESS: '0x11e3de1bda2650fa6bc74e7cea6a39559e59b103',
      TOKEN_WALLET_ADDRESS: '0x11e3de1bda2650fa6bc74e7cea6a39559e59b103',
      PRESALE_TOKEN: '0x2469f31A34FCaAc0debf73806cE39B2388874B13'
    }
  }
}

module.exports = config