const assert = require('assert')
const { investments, strategies } = require('../tools')

describe('investments', () => {
  describe('#calculateInitial', () => {
    const fund = 0.001, profit = 0.0005
    const strategy = strategies.oneToOne(fund, profit)
    const currency = { symbol: 'testBTC', price: 0.00025 }
    const investment = investments.calculateInitial(strategy, currency)

    it('symbol', () => assert.equal(investment.symbol, 'testBTC'))
    it('price', () => assert.equal(investment.price, 0.00025))
    it('quantity', () => assert.equal(investment.quantity, 4))
    it('target', () => assert.equal(investment.target, 0.000375))
    it('abort', () => assert.equal(investment.abort, 0.000125))
    it('increase', () => assert.equal(investment.increase, 0.000125))
    it('decrease', () => assert.equal(investment.decrease, 0.000125))
  })

  describe('#calculateHold', () => {
    const fund = 0.001, profit = 0.0005
    const strategy = strategies.oneToOne(fund, profit)
    const currency = { symbol: 'testBTC', price: 0.00025 }
    const investment = investments.calculateInitial(strategy, currency)
    const hold = investments.calculateHold(investment)

    it('target', () => assert.equal(hold.target, 0.0004375))
    it('abort', () => assert.equal(hold.abort, 0.0003375))
    it('holding', () => assert.equal(hold.holding, true))
  })
})
