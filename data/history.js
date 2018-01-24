const db = require('../database/db')
const Binance = require('../exchange/Binance')

// const PAIR = 'ETHBTC'
const HOURS = 4
const INTERVAL = HOURS + 'h'
const table = INTERVAL

const k = Binance.klineIndices()

let timeout = 1000
let startTime = 1500005340000
let endTime = 1516019318000

async function run () {
  let pairs = await db.selectAll('currencies')
  pairs = pairs.map(x => x.symbol)

  let index = 0
  const loop = setInterval(async () => {
    try {
      const response = await Binance.timestampedKline(pairs[index], INTERVAL, startTime)

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

      startTime = incrementTimestamp(startTime, hours(HOURS))
      console.log('success #' + pairs[index])


      if(startTime > endTime){
        ++index
      }

      if(index === pairs.length){
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

function incrementTimestamp(timestamp, duration){
  return timestamp + 500 * duration
}

function seconds(num){
  return 1000 * num
}

function minutes(num){
  return seconds(60) * num
}

function hours(num){
  return minutes(60) * num
}

run()