'use strict'
var assert = require('assert')
var objectAssign = require('object-assign')
var extract = require('url-querystring')

/* TODO
  var url = extract(req.url.replace('/api/', ''))

  delete url.qs._ // remove cache param
  var urlString = Object.keys(url.qs).map(function (k) {
    return k + '=' + encodeURIComponent(url.qs[k])
  }).join('&')

  urlString = urlString ? url.url + '?' + urlString : url.url
 */

APICache.prototype.onResponse = function(response) {
	var body = ''
  response.on('data', function(chunk) {
    body += chunk
  })
  response.on('end', function () {
    console.log('BODY: ' + body);
    console.log('headers', response.headers)
    console.log('method', response.method)
    console.log('statusCode', response.statusCode)
    // TODO
    console.log('response', response)
  });
}

APICache.prototype.onError = function() {

}

function APICache(config) {
	assert(config, 'APICache requres config provided')
	assert(config.cacheDir, 'APICache: provide cacheDir')
	assert(config.excludeRequestHeaders, 'APICache: provide excludeRequestHeaders')

	config = objectAssign({
		excludeRequestParams: []
	}, config)

	this.config = config
	this.onError = APICache.prototype.onError.bind(this)
	this.onResponse = APICache.prototype.onResponse.bind(this)
}

module.exports = APICache
