const portfolio = 'portfolio'
const history = 'history'

class Portfolio {

  constructor (database) {
    this.db = database
  }

  add (investment) {
    return this.db.insert(portfolio, addTimestamp(investment, 'time'))
  }

  async remove (investment) {
    try {
      await this.db.remove(portfolio, 'symbol', investment.symbol)
      await this.db.insert(history, addTimestamp(investment, 'saleTime'))

    } catch (err) {
      throw err
    }
  }

  update (investment) {
    return this.db.update(portfolio, investment)
  }

  read (symbol) {
    return symbol ? this.db.select(portfolio, 'symbol', symbol)
                  : this.db.selectAll(portfolio)
  }

  history () {
    return this.db.selectAll(history)
  }

  async clear () {
    if(process.env.NODE_ENV === 'test')
      try {
        await this.db.removeAll(portfolio)
        await this.db.removeAll(history)

      } catch (err) {
        throw err
      }
  }
}

function addTimestamp (investment, name) {
  investment[name] = new Date().valueOf()
  return investment
}

module.exports = Portfolio