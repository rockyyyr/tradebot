const assert = require('assert')
const { strategies } = require('../tools')

describe('strategies', () => {
  const fund = 0.001, profit = 0.0005

  describe('#oneToOne', () => {
    const strategy = strategies.oneToOne(fund, profit)

    it('fund', () => assert.equal(strategy.fund, 0.001))
    it('target', () => assert.equal(strategy.target, 0.0015))
    it('abort', () => assert.equal(strategy.abort, 0.0005))
    it('profit', () => assert.equal(strategy.limit.profit, 0.0005))
    it('loss', () => assert.equal(strategy.limit.loss, 0.0005))
  })

  describe('#twoToOne', () => {
    const strategy = strategies.twoToOne(fund, profit)

    it('fund', () => assert.equal(strategy.fund, 0.001))
    it('target', () => assert.equal(strategy.target, 0.0015))
    it('abort', () => assert.equal(strategy.abort, 0.00075))
    it('profit', () => assert.equal(strategy.limit.profit, 0.0005))
    it('loss', () => assert.equal(strategy.limit.loss, 0.00025))
  })
})