const { analyzer, automator } = require('./tools')
const { Market, Binance } = require('./exchange')
const { Account } = require('./personal')
const database = require('./database/db')

const { generic } = require('./tools/indicators/candlesticks')

// const account = new Account(Binance, database)
const market = new Market(Binance)

console.log('\n************************************ TRADEBOT **************************************\n')

analyzer.scanFor(generic, market, database)
// automator.run(account, market)
