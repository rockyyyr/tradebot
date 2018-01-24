const db = require('../database/db')
const binance = require('../exchange/Binance')

async function getPairs(){
  const response = await binance.prices()

  const pairs = response
    .map(x => {
      return {
        symbol: x.symbol
      }
    })
    .filter(x => !x.symbol.endsWith('BNB'))

  // console.log(pairs.toString())

  try {
    await db.batchInsert('currencies', pairs)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('finished...')
  process.exit(0)
}

getPairs()