const fs = require('fs')

/**
 * Amount of candlesticks in a row to match against
 */
const LOOKAHEAD = 3

/**
 * Percentage of difference in price between to candlesticks
 */
const THRESHOLD = percent(10)

/**
 * Interval value and formatted interval string which determines the timeframe of
 * kline data to be analyzed
 */
const INTERVAL = 6
const FORMATTED_INTERVAL = `${INTERVAL}h`

/**
 * Detect the Three Black Crows candle stick pattern and
 * return the ending index of each detected occurrence
 *
 * @param market the market to get kline data from
 * @returns {Promise.<Integer>}
 */
async function run (market) {
  const kline = require('../../../data/VENBTC_6h.json')

  const klineIndices = market.klineIndices()

  const occurrences = await findPatterns(kline, klineIndices)
  const results = await checkResults(kline, klineIndices, occurrences)

  console.log(JSON.stringify(results))
  return results
}

/**
 * Iterate over an array kline data and look for the specified pattern.
 *
 * @param kline data array to iterate over
 * @param k     kline indices profile (usually OHLC values)
 * @returns {Promise.<Array>} ending indexes of matched patterns in the array
 */
async function findPatterns (kline, k) {
  const length = kline.length - LOOKAHEAD

  let results = []
  let count = 0, i

  for(i = 0; i < length; i++) {
    const result = recursiveCheck(kline, i, k)

    if(result !== 0) {
      results.push(result)
    }

    if(++count === length) {
      return results
    }
  }
}

/**
 * Push OHLC data to a 2D array from indexes of where detected pattern matches occurred
 *
 * @param kline
 * @param k
 * @param x
 * @returns {Promise.<Array>}
 */
async function checkResults (kline, k, x) {
  let opens = []
  let highs = []
  let lows = []
  let closes = []
  let prevClose = []

  let count = 0, i, j
  for(i = 0; i < x.length; i++) {
    opens.push([])
    highs.push([])
    lows.push([])
    closes.push([])
    prevClose.push([])

    for(j = 0; j < LOOKAHEAD; j++) {
      opens[i].push(parseFloat(kline[x[i]][k.open]))
      highs[i].push(parseFloat(kline[x[i]][k.high]))
      lows[i].push(parseFloat(kline[x[i]][k.low]))
      closes[i].push(parseFloat(kline[x[i]][k.close]))
      prevClose[i].push(parseFloat(kline[x[i] - 1][k.close]))
    }

    if(++count === x.length) {
      return buildCandlesticksFromAverages(opens, highs, lows, closes, prevClose, k)
    }
  }
}

/**
 * Build a 2D array of OHLC data
 *
 * @param open
 * @param high
 * @param low
 * @param close
 * @param prevClose
 * @param k
 * @returns {Promise.<Array>}
 */
async function buildCandlesticksFromAverages (open, high, low, close, prevClose, k) {
  let results = [], count = 0, i
  for(i = 0; i < LOOKAHEAD; i++) {

    try {
      results.push([])
      results[i].push(time((i + 1) * INTERVAL))

      const openCloseChange = averageChange(close[i], open[i])
      console.log(openCloseChange)
      const highLowChange = averageChange(high[i], low[i])

      if(i === 0) {
        results[i].push(prevClose[i][0]) //open
      } else {
        results[i].push(results[i - 1][k.close])
      }

      results[i].push(0.00003) //high
      results[i].push(0.00003) //low
      results[i].push(parseFloat(prevClose[i][0]) + (parseFloat(close[i]) * openCloseChange)) //close NOT CORRECT***************

    } catch (err) {
      console.error(err)
    }

    if(++count === LOOKAHEAD) {
      return results
    }
  }
}

/**
 * Recursively analyze a set of candlesticks, checking if the difference between i and i + 1
 * is greater than the threshold.
 *
 * The size of the set is determined by the LOOKAHEAD value
 *
 * @param data  array of kline data
 * @param i     current index
 * @param k     kline indices profile
 * @param count current recursive count
 * @returns {number} ending index number of a matched Three Black Crows pattern or 0 if no pattern was matched
 */
function recursiveCheck (data, i, k, count = 0) {
  const initial = data[i][k.close]
  const next = data[i + 1][k.close]

  if(greaterThanThreshold(initial, next)) {
    return recursiveCheck(data, ++i, k, ++count)
  } else {
    return count === LOOKAHEAD - 1 ? i : 0
  }
}

/**
 * Get change percentage between two candlesticks apply the percentage to the current open price
 * to determine the next close price
 *
 * @param current
 * @param original
 */
function averageChange (current, original) {
  let result = [], count = 0, i
  for(i = 0; i < current.length; i++){
    const change = calculateChange(current[i], original[i])
    result.push(change)

    if(++count === current.length){
      return average(result)
    }
  }
}

function calculateChange(current, original){
  return ((original - current) / original)
}

/**
 * Check if the difference between two values is greater than the threshold.
 * This determines a successful detection
 *
 * @param original the original value
 * @param close    the value to check against
 * @returns {boolean} true if the difference between the two values is greater than the threshold
 */
function greaterThanThreshold (original, close) {
  return original - close > percentOf(original, THRESHOLD)
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
 * @param num
 * @returns {number} a number as a percent
 */
function percent (num) {
  return num / 100
}

/**
 * Get the average value of the values in an array
 *
 * @param array the array to average
 * @returns {number} average value of values from array
 */
function average (array) {
  return array.reduce((a, b) => a + b, 0) / array.length
}

function time (plus) {
  let date = new Date()
  date = date.setHours(date.getHours() + plus)
  return date
}

module.exports = { run }