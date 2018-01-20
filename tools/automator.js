function run(account, market){

}


function buying (indicator, portfolio) {
  setInterval(async () => {
    const buyingEnabled = await portfolio.buying()

    if(buyingEnabled && indicator.hasResults()) {
      try {
        const result = await indicator.getResult()
        await portfolio.buy(result)
        await indicator.removeResult(result)

      } catch (err) {
        console.error(err)
      }
    }
  }, 1000)
}

function selling (market, portfolio) {
  setInterval(async () => {
    const sellingEnabled = await portfolio.selling()

    if(sellingEnabled) {
      let prices, investments

      try {
        prices = await market.prices()
        investments = await portfolio.getPortfolio()
        investments.forEach(investment => analyze(portfolio, investment, prices))

      } catch (err) {
        console.error(err)
      }
    }
  }, 1000 * 60 * 3)
}

async function analyze (portfolio, investment, prices) {
  const price = getPrice(investment.symbol, prices)

  let action
  if(price >= investment.target) {
    action = portfolio.hold
  } else if(price <= investment.abort) {
    action = portfolio.sell
  }

  if(action) {
    try {
      await action(investment)
    } catch (err) {
      console.error(err)
    }
  }
}

function getPrice (symbol, prices) {
  return prices.filter(item => item.symbol === symbol)[0].price
}

module.exports = { buying, selling }
