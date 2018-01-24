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