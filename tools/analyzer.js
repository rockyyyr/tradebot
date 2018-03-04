async function scanFor (indicator, market, database) {
  try {
    let pairs = await database.selectAll('currencies')
    pairs = pairs.map(x => x.symbol)

    let history = await database.selectAll('4h')
    history = history.map(x => Object.values(x))

    let count = 0
    const loop = setInterval(async () => {
      const data = await market.kline(pairs[count], '4h', 10)
      const result = await indicator.run(data, history, market.klineIndices())

      if(result.samples > 0 && result.totalChange > 1 || result.totalChange < 1) {
      // if(result.samples > 0) {
        try {
          await database.insert('resultsets', {
            symbol: pairs[count],
            current: JSON.stringify(result.current),
            result: JSON.stringify(result.results),
            samples: result.samples,
            totalChange: result.totalChange.toFixed(8)
          })
          console.log(`${pairs[count]} inserted successfully`)

        } catch(err){
          console.error(err)
        }

        // const change = parseFloat(result.totalChange.toFixed(8))
        // console.log(`${pairs[count].padStart(10)} | change: ${change.toString().padEnd(16)} | samples: ${result.samples}`)
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