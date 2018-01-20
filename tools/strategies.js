function oneToOne (fund, limit){
  const target = fund + limit
  const abort = fund - limit
  return {
    fund: fund,
    target, abort,
    limit: {
      profit: limit,
      loss: limit,
    }
  }
}

function twoToOne (fund, profit){
  const loss = profit / 2
  const target = fund + profit
  const abort = fund - loss
  return {
    fund, target, abort,
    limit: {
      profit,
      loss
    }
  }
}

module.exports = {
  oneToOne,
  twoToOne
}
