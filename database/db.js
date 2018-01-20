const DatabaseError = require('./DatabaseError')
const knex = require('./knex')

async function insert (table, data) {
  try {
    return await knex.insert(data).into(table)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function batchInsert (table, data) {
  try {
    return await knex.batchInsert(table, data, 1000)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function select (table, key, value) {
  try {
    return await knex.select(key, value).from(table)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function selectAll (table) {
  try {
    return await knex.select().from(table)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function remove (table, key, value) {
  try {
    return await knex(table).where(key, value).del()
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function removeAll (table) {
  try {
    return await knex.del().from(table)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function update (table, data) {
  try {
    return await knex(table).update(data)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

async function rebuild (table, data) {
  try {
    await knex.del().from(table)
    return await knex.batchInsert(table, data)
  } catch (err) {
    throw new DatabaseError(err)
  }
}

module.exports = { insert, batchInsert, select, selectAll, remove, removeAll, update, rebuild }
