const assert = require('assert')
const database = require('../database/db')
const { Account } = require('../personal')
const { Binance } = require('../exchange')
const { strategies, investments } = require('../tools')

describe('Account', () => {
  const account = new Account(Binance, database)

  const fund = 0.001, profit = 0.00005
  const currency = { symbol: 'LTCBTC', price: 0.012345 }
  const strategy = strategies.oneToOne(fund, profit)

  describe('#buy', () => {

    it('investment saves to portfolio', async () => {
      const investment = investments.calculateInitial(strategy, currency)
      try {
        await account.reset()
        await account.buy(investment)

      } catch (err) {
        return console.error(err)
      }

      const portfolio = await account.assets()
      return assert(portfolio.length, 1)
    })

    it('investment is retrievable', async () => {
      const investment = investments.calculateInitial(strategy, currency)
      try {
        await account.reset()
        await account.buy(investment)

      } catch (err) {
        return console.error(err)
      }

      const portfolio = await account.assets()
      return assert(portfolio[0].symbol, 'LTCBTC')
    })
  })

  describe('#sell', () => {

    it('investment can be sold', async () => {
      const investment = investments.calculateInitial(strategy, currency)
      try {
        await account.reset()
        await account.buy(investment)
        await account.sell(investment)

      } catch (err) {
        return console.error(err)
      }

      const portfolio = await account.assets()
      return assert(portfolio.length === 0)
    })

    it('investment saves to history', async () => {
      const investment = investments.calculateInitial(strategy, currency)
      try {
        await account.reset()
        await account.buy(investment)
        await account.sell(investment)

      } catch (err) {
        return console.error(err)
      }

      const history = await account.history()
      return assert(history.length === 1)
    })

  })

  describe('#hold', () => {

    it('investment can be updated and held', async () => {
      const investment = investments.calculateInitial(strategy, currency)
      const currency2 = {
        symbol: 'ETHBTC',
        price: 0.010789
      }
      const investment2 = investments.calculateInitial(strategy, currency2)

      let portfolio
      try {
        await account.reset()
        await account.buy(investment)
        await account.buy(investment2)
        portfolio = await account.assets()
        // const hold = investments.calculateHold(portfolio[0])
        // await account.hold(hold)

      } catch (err) {
        return console.error(err)
      }

      portfolio = await account.assets()

      console.log(portfolio.length)
      console.log(JSON.stringify(portfolio))
      return assert(portfolio.length, 2) && assert(portfolio[0].symbol, 'LTCBTC')
    })
  })


})