const db = require('../database/db')
const Binance = require('../exchange/Binance')

const table = 'ETH1h'
const k = Binance.klineIndices()

let timeout = 1000
let startTime = 1500005340000
let endTime = 1516019318000

function run () {
  let index = 0
  const loop = setInterval(async () => {
    try {
      const response = await Binance.timestampedKline('ETHBTC', '1h', startTime)

      const data = response.map(item => {
        return {
          openTime: item[k.openTime],
          open: item[k.open],
          high: item[k.high],
          low: item[k.low],
          close: item[k.close],
          volume: item[k.volume],
          closeTime: item[k.closeTime]
        }
      })

      await db.batchInsert(table, data)

      startTime = incrementTimestamp(startTime)
      console.log('success #' + ++index)

      if(startTime > endTime){
        clearInterval(loop)
        console.log('process finished. exiting...')
        process.exit(0)
      }

    } catch (err) {
      console.log(err)
      console.log('exiting...')
      process.exit(1)
    }
  }, timeout)
}

function incrementTimestamp(timestamp){
  return timestamp + 500 * 60 * 1000
}

run()