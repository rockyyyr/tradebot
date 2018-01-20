const TransactionError = require('./TransactionError')
const request = require('./request')

function account () {
  return request.signed.get('/v3/personal')
}

function buy ({ symbol, quantity, price }) {
  try {
    return order(symbol, quantity, price, 'BUY')
  } catch (err) {
    throw new TransactionError(err)
  }
}

function sell ({ symbol, quantity, price }) {
  try {
    return order(symbol, quantity, price, 'SELL')
  } catch (err) {
    throw new TransactionError(err)
  }
}

function order () {
  return 'ordered'
}

// function order (symbol, quantity, price, side) {
//   return request.signed.post('/v3/order/test', {
//     symbol, quantity, price, side,
//     type: 'LIMIT', timeInForce: 'GTC'
//   })
// }

function prices () {
  return request.unsigned.get('/v1/ticker/allPrices')
}

function kline (symbol, interval, limit = 500) {
  return request.unsigned.get(`/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
}

function timestampedKline (symbol, interval, start) {
  return request.unsigned.get(`/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${start}`)
}

function klineIndices () {
  return { openTime: 0, open: 1, high: 2, low: 3, close: 4, volume: 5, closeTime: 6 }
}

module.exports = { account, buy, sell, prices, kline, timestampedKline, klineIndices }
