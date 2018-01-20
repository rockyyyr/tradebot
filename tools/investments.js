function calculateInitial (strategy, currency) {
  const price = parseFloat(currency.price)
  const increase = price / (strategy.fund / strategy.limit.profit)
  const decrease = price / (strategy.fund / strategy.limit.loss)
  return {
    symbol: currency.symbol,
    price: parseFloat(price.toFixed(8)),
    quantity: parseFloat((strategy.fund / price).toFixed(8)),
    target: parseFloat((price + increase).toFixed(8)),
    abort: parseFloat((price - decrease).toFixed(8)),
    increase: parseFloat(increase.toFixed(8)),
    decrease: parseFloat(decrease.toFixed(8))
  }
}

function calculateHold(investment){
  investment.abort = parseFloat(parseFloat(investment.target) - parseFloat(investment.target * 0.1))
  investment.target = parseFloat(parseFloat(investment.target) + parseFloat(investment.increase / 2))
  investment.holding = true
  return investment
}

module.exports = {
  calculateInitial,
  calculateHold
}
