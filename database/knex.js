const connection =
  process.env.DATABASE_URL || (process.env.NODE_ENV === 'test' ?
    require('../properties/test_database.json') : require('../properties/database.json'))

const knex = require('knex')({
  client: 'mysql2',
  connection: connection,
  pool: { min: 0, max: 7 }
})

knex.schema.hasTable('ETH1h').then(exists => { if(!exists) createLTCDataTable() })
knex.schema.hasTable('history').then(exists => { if(!exists) createHistoryTable() })
knex.schema.hasTable('portfolio').then(exists => { if(!exists) createPortfolioTable() })
knex.schema.hasTable('currencies').then(exists => { if(!exists) createCurrenciesTable() })

function createPortfolioTable () {
  knex.schema.createTable('portfolio', column => {
    column.string('time')
    column.string('symbol')
    column.decimal('quantity', 16, 8)
    column.decimal('price', 16, 8)
    column.decimal('target', 18, 8)
    column.decimal('abort', 16, 8)
    column.decimal('increase', 16, 8)
    column.decimal('decrease', 16, 8)
    column.boolean('holding').defaultTo(false)
    column.integer('holds').defaultTo(0)

  }).then(() => console.log('portfolio table created'))
    .catch(console.error)
}

function createHistoryTable(){
  knex.schema.createTable('history', column => {
    column.string('time')
    column.string('saleTime').defaultTo(null)
    column.string('symbol')
    column.decimal('quantity', 16, 8)
    column.decimal('price', 16, 8)
    column.decimal('target', 18, 8)
    column.decimal('abort', 16, 8)
    column.decimal('increase', 16, 8)
    column.decimal('decrease', 16, 8)
    column.boolean('holding').defaultTo(false)
    column.integer('holds').defaultTo(0)
    column.boolean('success').defaultTo(false)

  }).then(() => console.log('history table created'))
    .catch(console.error)
}

function createCurrenciesTable(){
  knex.schema.createTable('currencies', column => {
    column.string('symbol')

  }).then(() => console.log('currencies table created'))
    .catch(console.error)
}

function createLTCDataTable(){
  knex.schema.createTable('ETH1h', column => {
    column.string('openTime')
    column.decimal('open', 16, 8)
    column.decimal('high', 16, 8)
    column.decimal('low', 16, 8)
    column.decimal('close', 16, 8)
    column.decimal('volume', 16, 8)
    column.string('closeTime')

  }).then(() => console.log('LTC1m data table created'))
    .catch(console.error)
}

module.exports = knex
