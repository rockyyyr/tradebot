const Portfolio = require('./Portfolio')

class Account {

  constructor (exchange, database) {
    this.exchange = exchange
    this.portfolio = new Portfolio(database)
  }

  async buy (investment) {
    try {
      await this.exchange.buy(investment)
      await this.portfolio.add(investment)

    } catch (err) {
      throw err
    }
  }

  async sell (investment) {
    try {
      await this.exchange.sell(investment)
      await this.portfolio.remove(investment)

    } catch (err) {
      throw err
    }
  }

  hold (investment) {
    return this.portfolio.update(investment)
  }

  details () {
    return this.exchange.account()
  }

  assets () {
    return this.portfolio.read()
  }

  asset (symbol) {
    return this.portfolio.read(symbol)
  }

  history () {
    return this.portfolio.history()
  }

  reset () {
    return this.portfolio.clear()
  }
}

module.exports = Account