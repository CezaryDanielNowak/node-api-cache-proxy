var express = require('express')
var APICacheProxy = require('node-api-cache-proxy')
var fs = require('fs')
var open = require('open')

/*
 * configure cache proxy
 */
var app = express()
var apiCacheProxy = new APICacheProxy({
  apiUrl: 'http://api.giphy.com/',
  cacheDir: 'cache-api/',
  localURLReplace: function(url) {
    return url.replace('/giphy/', '/')
  }
})

/*
 * start express app
 */
app.listen(9999, 'localhost', function () {
  console.log('Server started at ', 'http://localhost:9999')
  open('http://localhost:9999')
})

/*
 * allow requests from any server
 */
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  return next()
})

/*
 * proxy all /giphy/* requests with localhost:9999
 */
app.use('/giphy', apiCacheProxy)

/*
 * demo page
 */
app.use('/', function(req, res) {
  fs.createReadStream('./index.html').pipe(res)
})
