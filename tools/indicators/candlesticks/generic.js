const db = require('../../../database/db')

/**
 * Amount of candlesticks in a row to match against
 */
const LOOKAHEAD = 3

/**
 * Amount of candlesticks in a row to analyze, starting from
 * the current candlestick and incrementing backwards
 */
const LOOKBACK = 3

/**
 * Percentage of difference in price between to candlesticks
 */
const THRESHOLD = percent(0.1)

/**
 * Interval value and formatted interval string which determines the timeframe of
 * kline data to be analyzed
 */
const INTERVAL = 6
const FORMATTED_INTERVAL = INTERVAL + 'h'

/**
 * Make a prediction of the next n points of data based on occurrences in historical data
 *
 * @param currentKlineData current candlestick data to analyze
 * @param market
 */
async function run (market) {

  let history = require('../../../data/VENBTC_6h.json')
  let testData = history.slice(0, 124)

  let kline
  try {
    kline = await db.selectAll('ltc1h')
    history = kline.map(ohlc => Object.values(ohlc))
    testData = history.slice(200000, 200214)

    // console.log(history.length)
    // history = history.slice(0, 10)
    // history.forEach(x => console.log(x))

  } catch (err) {
    console.log(err)
  }


  // testData.forEach((x, i) => console.log(JSON.stringify(x) + ' | ' + i))

  try {
    const klineIndices = market.klineIndices()

    const changes = await getChangeForEachCandleStick(testData, klineIndices)
    if(changes.length > 0) changes.forEach(x => console.log('change: ' + JSON.stringify(x)))

    const currentCandlestick = testData[testData.length - 1]
    console.log(JSON.stringify(currentCandlestick))

    const patterns = await findPatterns(history, changes, klineIndices, candlesticksAfterCurrentTrend)
    // patterns.forEach((x, i) => console.log(JSON.stringify(x) + ' | ' + i))
    console.log(patterns.length)
    // if(patterns.length > 0) patterns.forEach(x => console.log(JSON.stringify(x)))
    // console.log(patterns.length)

    const averageChanges = await getAverageChanges(patterns, klineIndices)
    if(averageChanges.length > 0) averageChanges.forEach(x => console.log(JSON.stringify(x)))

    const final = await applyPriceToAverages(averageChanges, currentCandlestick, klineIndices)
    final.forEach(x => console.log(JSON.stringify(x)))

    console.log('\nexiting...')
    process.exit(0)

  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

/**
 * Read an amount of current candlesticks determined by the LOOKBACK
 * value and calculate their change over the time frame.
 * Candlesticks are returned in chronological order, index = length - 1 being the latest
 * or current candlestick
 *
 * VERIFIED
 *
 * @param kline
 * @param k
 * @returns {Promise.<Array>}
 */
async function getChangeForEachCandleStick (kline, k) {
  let results = []
  let count = 0, i

  for(i = kline.length - LOOKBACK; i < kline.length; i++) {
    const open  = kline[i][k.open]
    const close = kline[i][k.close]

    results.push(calculateChange(open, close))

    if(++count === LOOKBACK) {
      return results
    }
  }
}

/**
 * Returns an array of historical data indexes representing the first candlestick after a set has been matched
 *
 * @param history
 * @param changes
 * @param k
 * @param matcher
 * @returns {Promise.<Array>}
 */
async function findPatterns (history, changes, k, matcher) {
  let results = []
  let count = 0, i

  try {
    for(i = 0; i < history.length; i++) {
      const result = matcher(history, changes, i, k)

      // if a result is found, the recursive function has iterated,
      // increase i and count past the iterations of the recursive function
      if(result !== 0) {
        if(i + LOOKBACK < history.length - 1){
          i += LOOKBACK - 1
          count += LOOKBACK - 1
        }
        // console.log('result ' + result)

        results.push(result)
      }

      if(++count === history.length) {
        return results
      }
    }
  } catch (err) {
    throw err
  }
}

/**
 * Analyze a set of candlesticks representing the current trend (amount determined by the LOOKBACK value)
 * and attempt to match the set with a similar set in historical kline data. A set is matched if it is
 * within the THRESHOLD value of the current trend set. If a matching set is found, the index of the
 * subsequent candlestick is returned.
 *
 * Example:
 *
 * Current trend set = [121, 122, 123]
 * Pattern is matched at [345, 346, 347]
 * Return value is 348
 *
 * VERIFIED
 *
 * @param history historical kline data
 * @param changes changes of current trend
 * @param i       index
 * @param k       kline indices
 * @param count   count of recursive iterations. Used as the index value of the changes argument
 * @returns {number} historical data index of the subsequent candlestick after a set is matched
 */
function recursiveChangeMatching (history, changes, i, k, count = 0) {
  const open  = history[i][k.open]
  const close = history[i][k.close]

  const change = calculateChange(open, close)

  if(Math.abs(change - changes[count]) < THRESHOLD) {
    if(i + 1 < history.length) {
      return recursiveChangeMatching(history, changes, ++i, k, ++count)
    }
  } else {
    return count === LOOKBACK  ? i : 0
  }
}

/**
 * Analyze a set of candlesticks representing the current trend (amount determined by the LOOKBACK value)
 * and attempt to match the set with a similar set in historical kline data. A set is matched if it is
 * within the THRESHOLD value of the current trend set. If a matching set is found, the candlestick at
 * index + LOOKBACK + 1 is return. This will be the next candlestick after the current trend candlestick
 *
 * Example:
 *
 * Current trend set at indexes: 120, 121, 122
 * Pattern is matched at indexes: 345, 346, 347
 * Returned array is candlesticks at indexes: 348, 349, 350
 *
 * @param history historical kline data
 * @param changes changes of current trend
 * @param i       index
 * @param k       kline indices
 * @param results array containing corresponding matched candlesticks
 * @returns {number} historical data index of the subsequent candlestick after a set is matched
 */
function candlesticksAfterCurrentTrend (history, changes, i, k, results = []) {
  const open  = history[i][k.open]
  const close = history[i][k.close]

  const change = calculateChange(open, close)

  if(withinThreshold(change, changes[results.length])) {
    if(i + LOOKBACK + 1 < history.length) {
      results.push(history[i + LOOKBACK + 1])
      return candlesticksAfterCurrentTrend(history, changes, ++i, k, results)
    } else {
      return 0
    }
  } else {
    return results.length === LOOKBACK ? results : 0
  }
}

/**
 * Check whether or not one data point equals another, allowing for a margin
 * set by the THRESHOLD value. Used for matching the change of one candlestick vs
 * the change of another candlestick
 *
 * @param a
 * @param b
 * @returns {boolean} true if two data points are within the THRESHOLD, false otherwise
 */
function withinThreshold(a, b){
  return Math.abs(a - b) < THRESHOLD
}

/**
 * Return a candlestick set that occurred immediately after a matched pattern in a data set
 *
 * @param kline     kline data set
 * @param locations indices representing the last candlestick in a detected pattern.
 * @param k         kline indices
 * @returns {Promise.<Array>}
 */
async function getOccurrences (kline, locations, k) {
  let results = [], count = 0, i, j

  try {
    for(i = 0; i < locations.length; i++) {
      results.push([])
      const index = locations[i] + 1

      for(j = index; j < index + LOOKBACK; j++) {
        if(index + LOOKBACK < kline.length) {
          results[i].push([kline[j][k.openTime], kline[j][k.open], kline[j][k.high], kline[j][k.low], kline[j][k.close]])
        }
      }

      if(++count === locations.length) {
        return results
      }
    }
  } catch (err) {
    throw err
  }
}

/**
 * Calculate the average change of multiple samples of candlesticks
 *
 * @param x an array of candlesticks that occurred after a matched pattern
 * @param k kline indices
 * @returns {Promise.<Array>} array where each element represents the average change for a candlestick
 */
async function getAverageChanges (x, k) {
  let values = [], averages = [], count = 0

  try {
    for(let j = 0; j < LOOKBACK; j++) { // for each candle in a set
      values.push([])
      for(let i = 0; i < x.length; i++) {  // for each set of candle sticks
        if(x[i].length > 0) {
          const close = x[i][j][k.close]
          const open = x[i][j][k.open]

          values[j].push(calculateChange(open, close))
        }
      }

      const averageChange = average(values[j])
      averages.push(averageChange)

      if(++count === LOOKAHEAD) {
        return averages
      }
    }

  } catch (err) {
    throw err
  }
}

async function applyPriceToAverages(changes, candlestick, k){
  let results = [], open, close
  let count = 0, i
  for(i = 0; i < changes.length; i++){

    if(i === 0){
      open = parseFloat(candlestick[k.close])
    } else {
      open = close
    }

    // close = parseFloat(parseFloat(open + (open * changes[i])).toFixed(8))
    close = round(open + (open * changes[i]), 8)

    results.push([open, close])

    if(++count === changes.length){
      return results
    }
  }
}

/**
 * Calculate the change percentage between two values
 *
 * @param open  open price
 * @param close close price
 * @returns {number} change percentage between the parameter prices
 */
function calculateChange (open, close) {
  return ((close - open) / close)
}

/**
 * Get the a specified percentage of a value
 *
 * @param value   the original value
 * @param percent the percentage to get
 * @returns {number} value of the specified percent of the original value
 */
function percentOf (value, percent) {
  return value * percent
}

/**
 * @param num number to convert to a percentage
 * @returns {number} a number as a percent
 */
function percent (num) {
  return num / 100
}

/**
 * Round a number to a specified precision
 *
 * @param number    number to round
 * @param precision precision to round to
 * @returns {number} rounded number
 */
function round(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

/**
 * Get the average value of the values in an array
 *
 * @param array the array to average
 * @returns {number} average value of values from array
 */
function average (array) {
  try {
    return array.reduce((a, b) => a + b, 0) / array.length
  } catch (err) {
    throw err
  }
}

module.exports = { run }