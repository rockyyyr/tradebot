class Market {

  constructor(exchange){
    this.exchange = exchange
  }

  prices (){
    return this.exchange.prices()
  }

  kline (symbol, interval, limit) {
    return this.exchange.kline(symbol, interval, limit)
  }

  klineIndices(){
    return this.exchange.klineIndices()
  }
}

module.exports = Market
