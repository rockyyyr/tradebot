async function scanFor(indicator, market, database){
  const result = await indicator.run(market)


}

module.exports = { scanFor }