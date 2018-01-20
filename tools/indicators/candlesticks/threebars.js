
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
const FORMATTED_INTERVAL = INTERVAL + 'h'

/**
 * Detect the Three Black Crows candle stick pattern and
 * return the ending index of each detected occurrence
 *
 * @param market the market to get kline data from
 * @returns {Promise.<Integer>}
 */
async function run (market) {

  try {
    const kline = require('../../../data/VENBTC_6h.json')
    const klineIndices = market.klineIndices()

    const locations = await findPatterns(kline, klineIndices)
    locations.forEach(x => console.log(JSON.stringify(x)))

    const occurrences = await getOccurrences(kline, locations, klineIndices)
    // occurrences.forEach(x => console.log(JSON.stringify(x)))

    const averageChanges = await getAverageChanges(occurrences, klineIndices)
    // averageChanges.forEach(x => console.log(JSON.stringify(x)))

    console.log()
    process.exit(0)

  } catch (err) {
    console.log(err)
    process.exit(1)
  }
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

  try {
    for(i = 0; i < length; i++) {
      const result = recursiveCheck(kline, i, k)

      if(result !== 0) {
        results.push(result)
      }

      if(++count === length) {
        return results
      }
    }
  } catch (err) {
    throw err
  }
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

      for(j = index; j < index + LOOKAHEAD; j++) {
        results[i].push([kline[j][k.openTime], kline[j][k.open], kline[j][k.high], kline[j][k.low], kline[j][k.close]])
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
    for(let j = 0; j < LOOKAHEAD; j++) { // for each candle in a set

      values.push([])
      for(let i = 0; i < x.length; i++) {  // for each set of candle sticks

        const close = x[i][j][k.close]
        const open = x[i][j][k.open]

        values[j].push(calculateChange(open, close))
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
  try {
    return array.reduce((a, b) => a + b, 0) / array.length
  } catch (err) {
    throw err
  }
}

function time (plus) {
  let date = new Date()
  date = date.setHours(date.getHours() + plus)
  return date
}

module.exports = { run }