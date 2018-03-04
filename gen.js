const data = require('./test/data/change.json')
const k = { time: 0, open: 1, high: 2, low: 3, close: 4, volume: 5 }
const lookback = 3

/**
 * Calculate change percentage of open to close
 * 
 * @param {number} open   the opening price
 * @param {number} close  the closing price
 * @return {number} the difference between open and close as a percentage
 */
const change = (open, close) => (close - open) / open

/**
 * Apply a change percentage to a price
 * 
 * @param {number} price   the price to apply the change percentage to
 * @param {number} change  the change percentage
 * @return {number} a new price with the change percentage applied
 */
const applyChange = (price, change) => price + (price * change)

/**
 * Calculate change percentage between open and close on an array of kline data in OHLC format
 * 
 * @param {[OHLC]} kline  kline data array ( [time, open, high, low, close] )
 * @return {number} change percentage between open and closing price in kline data
 */
const changeInKline = kline => change(kline[k.open], kline[k.close])

/**
 * Calculate change percentages for each element in an array of kline data in OHLC format
 * 
 * input:
 *     [
 *         [time, open, high, low, close],
 *         [time, open, high, low, close],
 *         ...
 *     ]
 * 
 * @param {[ [OHLC] ]} set  an array of kline data in OHLC format
 * @return {array} an array of change percentages of kline data 
 */
const changeInKlineSet = set => set.map(kline => changeInKline(kline))

/**
 * Calculate change for each kline data array in an array of kline sets. Each element in a kline set
 * is a kline data array and adjacent elements represent adjacent time periods.
 * 
 * input:
 *   [    
 *     [
 *       [OHLC], ...
 *     ],
 *       ...
 *   ] 
 * 
 * output:
 *   [
 *     [0.6, ...],
       ...
 *   ]
 * 
 * @param {[ [ [OHLC] ] ]} samples  an array of kline sets. kline sets should be adjacent time periods
 * @return {[ [change] ]} an array of arrays where the elements of the inner arrays are change percentages for adjacent time periods
 */
const changeInSampleSet = samples => samples.map(set => changeInKlineSet(set))

/**
 * Average the change percentage for a time period. 
 * Each element is the change percentage of a time period
 * 
 * @param { [ [change] ] } changes  an array of arrays where the elements of the inner arrays are change percentages for adjacent time periods
 * @return {array} an array of average changes. Each element of the array represents adjacent time perdiods                                        
 */
const averageChangeOfSamples = changes => changes.reduce((acc, curr) => {
    curr.forEach((elem, i) => acc[i] = acc[i] ? acc[i] + elem : elem)
    return acc
}, []).map(x => x / changes.length)

/**
 * Apply the average change percentage to current kline data. 
 * 
 * @param {[average change]} average  array of average change for adjacent time periods
 * @param {[OHLC]} current  current kline data in OHLC format
 * @return {[ [OHLC] ]} an array of kline data with the 
 *                                                average change applied to each time period of the parameter 'average'
 */
const applyAverageToCurrent = (average, current) => average.reduce((acc, curr, i) => {
    acc[i] = changeCandlestick(i === 0 ? current : acc[i - 1], curr)
    return acc
}, [])

/**
 * Take data from the previous adjacent kline data point and apply a change percentage
 * to create the next kline data point
 * 
 * @param {[OHLC]} previous  the previous kline in OHLC format
 * @param {number} change    the percentage of change to apply
 */
const changeCandlestick = (previous, change) => {
    return [increment(previous[k.time], 1), previous[k.close], 0, 0, applyChange(previous[k.close], change)]
}

/**
 * Increment a time by a number of hours
 * 
 * @param {number} current  current time in milliseconds 
 * @param {number} hours    number of hours to increment current time by
 */
const increment = (current, hours) => new Date(current + toMillis(hours)).valueOf()

/**
 * Convert hours to milliseconds
 * 
 * @param {number} hours  number of hours to convert
 */
const toMillis = hours => hours * 3600000

/** 
 * Run the application
*/
async function run() {
    try {
        const samples = changeInSampleSet(data.sampleSet)
        const average = averageChangeOfSamples(samples)
        const applied = applyAverageToCurrent(average, data.currentCandlestick)

        console.log()
        console.log(applied)
        console.log()

    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

run()
