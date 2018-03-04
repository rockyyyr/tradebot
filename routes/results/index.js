const router = require('express').Router()
const resultset = require('./resultset')

router.get('/', async (req, res) => {
  const result = await resultset.get()
  res.json(result)
})

module.exports = router
