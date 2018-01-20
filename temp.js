const Binance = require('./exchange/Binance')

function calculateChange (open, close) {
  return ((close - open) / close)
}

function run(){
  const history = require('./data/VENBTC_6h.json')
  const testData = history.slice(0, 124)
  const k = Binance.klineIndices()

  console.log(calculateChange(history[123][k.open], history[123][k.close]))
}

run()