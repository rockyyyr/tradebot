const assert = require('assert')
const equal = require('array-equal')
const { generic } = require('../tools/indicators/candlesticks')
const { Binance } = require('../exchange')
const testData = require('./data/test-data.json')

/**
 * Dependent on profile. (LOOKBACK = 3, THRESHOLD = 10%)
 */
describe('Generic Candlestick Analysis', () => {
  const history = require('../data/VENBTC_6h.json')
  const verifiedTestData = require('./data/Verified-Generic-Test-data.json')

  const k = Binance.klineIndices()
  const testData = history.slice(0, 125)

  describe('#calculateChanges', () => {
    const verified = verifiedTestData.getChangesForCurrentCandleStick

    it('calculates the current change for each candlestick in current trend', async () => {
      const current = generic.getCurrentCandlesticks(testData)
      const changes = generic.calculateChanges(current, k)

      assert(equal(verified, changes))
    })
  })

  describe('#findPatterns', () => {
    const verified = verifiedTestData.findPatterns

    it('finds patterns in historical data', async () => {
      const current = generic.getCurrentCandlesticks(testData)
      const changes = generic.calculateChanges(current, k)
      const samples = await generic.findSamples(history, changes, k, generic.candlesticksAfterCurrentTrend)

      assert(
        samples[0][0][k.open]  === verified[0][0][k.open] &&
        samples[0][0][k.high]  === verified[0][0][k.high] &&
        samples[0][0][k.low]   === verified[0][0][k.low]  &&
        samples[0][0][k.close] === verified[0][0][k.close]
      )
    })
  })

  describe('#getAverageChanges', () => {
    // const verified = verifiedTestData.getAverageChanges
    //
    // it('returns average changes from all matched patterns', async () => {
    //   const current = generic.getCurrentCandlesticks(testData)
    //   const changes = generic.calculateChanges(current, k)
    //   const samples = await generic.findSamples(history, changes, k, generic.candlesticksAfterCurrentTrend)
    //   const averages = await generic.getAverageChanges(samples, k)
    //
    //   console.log(averages)
    //
    //   assert(equal(verified, averages))
    // })
    it('returns average changes from all matched patterns', async () => {
      const problem = testData.getAverageChanges
      const solution = testData.getAverageChangesSolution

      const result = await generic.getAverageChanges(problem, k)
      assert(equal(solution, result))
    })
  })

})