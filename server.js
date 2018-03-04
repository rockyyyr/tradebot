const server = require('express')()
const morgan = require('morgan')
const cors = require('cors')

const port = process.env.PORT || 3003

server.use(morgan('dev'))
server.use(cors())

server.use('/', require('./routes'))
server.listen(port, console.log(`listening on port ${port}`))

module.exports = server
