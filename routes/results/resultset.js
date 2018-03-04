const db = require('../../database/db')

function get(){
  return db.selectAll('resultsets')
}

module.exports = { get }
