const apiKey = process.env.API_KEY || require('../properties/api.json').key
const apiSecret = process.env.API_SECRET || require('../properties/api.json').secret

const query = require('querystring')
const crypto = require('crypto')

const axios = require('axios').create({
  baseURL: 'https://api.binance.com/api',
  headers: { 'X-MBX-APIKEY': apiKey }
})

const unsigned = {

  get: (url, data) => {
    return new Promise(resolve => {
      axios.get(url + (data ? '?' + data : ''))
        .then(response => resolve(response.data))
        .catch(error)
    })
  },

  post: (url, data) => {
    return new Promise(resolve => {
      axios.post(url + url + (data ? '?' + data : ''))
        .then(response => resolve(response.data))
        .catch(error)
    })
  }
}

const signed = {

  get: (url, data) => {
    return new Promise(resolve => {
      axios.get(url + sign(data))
        .then(response => resolve(response.data))
        .catch(error)
    })
  },

  post: (url, data) => {
    return new Promise(resolve => {
      axios.post(url + sign(data))
        .then(response => resolve(response.data))
        .catch(error)
    })
  }
}

function sign (data = {}) {
  data.timestamp = Date.valueOf()
  data.signature = crypto.createHmac('sha256', apiSecret).update(query.stringify(data)).digest('hex')

  return '?' + query.stringify(data)
}

function error (err) {
  console.error('error: ' + err.message)
}

module.exports = { unsigned, signed }
