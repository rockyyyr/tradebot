async function scanFor (indicator, market, database) {
  try {
    let pairs = await database.selectAll('currencies')
    pairs = pairs.map(x => x.symbol)

    let count = 0
    const loop = setInterval(async () => {
      const data = await market.kline(pairs[count], '4h', 10)
      const result = await indicator.run(market, data, database)

      if(result.samples > 0) {
        const change = parseFloat(result.totalChange.toFixed(8))
        console.log(`${pairs[count].padStart(10)} | change: ${change.toString().padEnd(16)} | samples: ${result.samples}`)
      }

      if(++count === pairs.length) {
        clearInterval(loop)
        console.log('finished...')
        process.exit(0)
      }
    }, 1000)

  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

module.exports = { scanFor }