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
const THRESHOLD = percent(10)

/**
 * Interval value and formatted interval string which determines the timeframe of
 * kline data to be analyzed
 */
const INTERVAL = 6
const FORMATTED_INTERVAL = INTERVAL + 'h'

/**
 * Make a prediction of the next n points of data based on occurrences in historical data
 *
 * @param market
 * @param data
 * @param database
 */
async function run (market, data, database) {
  try {
    const klineIndices = market.klineIndices()
    let history = await database.selectAll('4h')
    history = history.map(x => Object.values(x))

    const current = getCurrentCandlesticks(data)
    const changes = calculateChanges(current, klineIndices)
    const samples  = await findSamples(history, changes, klineIndices, candlesticksAfterCurrentTrend)
    const averages = await getAverageChanges(samples, klineIndices)
    const results  = await applyPriceToAverages(averages, current[current.length - 1], klineIndices)

    return {
      current,
      results,
      samples: samples.length,
      totalChange: (sum(averages) * 100) * 12
    }

  } catch (err) {
    throw err
  }
}

/**
 * Return the most current candlesticks from a data set. Amount of candlesticks is determined
 * by the LOOKBACK value. Most recent candlestick will be the last element of the return array
 *
 * @param data candlestick data set
 * @returns { Array } current candlesticks as OHLC data
 */
function getCurrentCandlesticks(data){
  return data.slice(data.length - 1 - LOOKBACK, data.length - 1)
}

/**
 * Calculate change for each element in an array of OHLC data
 *
 * @param data candlestick data set
 * @param k kline indices
 * @returns { Array } array who's elements are the open/close change for the time period
 */
function calculateChanges(data, k){
  return data.map(x => calculateChange(x[k.open], x[k.close]))
}

/**
 * Returns an array of every instance in historical data where a pattern was matched
 *
 * @param history
 * @param changes
 * @param k
 * @param matcher
 * @returns {Promise.<Array>}
 */
async function findSamples (history, changes, k, matcher) {
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

function findSamples2 (history, changes, k, matcher){
  let match = false
  return history.filter(async ohlc => {
    match = await matcher(history, changees, k)
  })
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

/**
 * Apply average changes of all patterns matched to the current trend pattern and
 * apply the current price to these averages to build a prediction in the form of
 * the next candlesticks (amount of candlesticks in prediction is determined by the
 * LOOKAHEAD value)
 *
 * @param changes     average changes of all matched patterns found in historical data
 * @param candlestick the current candlestick
 * @param k           kline indices
 * @returns { Array } an array containing the the prediction as OHLC candlestick data
 */
async function applyPriceToAverages(changes, candlestick, k){
  let results = [], time, open, high, low, close
  let count = 0, i
  for(i = 0; i < changes.length; i++){

    if(i === 0){
      time = incrementTime(candlestick[k.openTime], 1)
      // time = i
      open = parseFloat(candlestick[k.close])
    } else {
      time = incrementTime(time, 1)
      // time = i
      open = close.valueOf()
    }

    // close = parseFloat(parseFloat(open + (open * changes[i])).toFixed(8))
    // close = round(open + (open * changes[i]), 8)
    close = round(applyChange(open, changes[i]), 8)

    high = open.valueOf()
    low = close.valueOf()

    results.push([time, open, high, low, close])

    if(++count === changes.length){
      return results
    }
  }
}

function applyChange(price, change){
  return price + (price * change)
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

function incrementTime(current, plus){
  let date = new Date(current)
  date = date.setHours(date.getHours() + plus)
  return date.valueOf()
}

function print(array){
  array.forEach(x => console.log(JSON.stringify(x)))
}

function sum(array){
  return array.reduce((a, b) => a + b, 0)
}

module.exports = { run, getCurrentCandlesticks, calculateChanges, findSamples, candlesticksAfterCurrentTrend, getAverageChanges }