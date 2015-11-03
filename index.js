'use strict'
var assert = require('assert')
var extract = require('url-querystring')
var objectAssign = require('object-assign')
var zlib = require('zlib')

/* TODO
	var url = extract(req.url.replace('/api/', ''))

	delete url.qs._ // remove cache param
	var urlString = Object.keys(url.qs).map(function (k) {
		return k + '=' + encodeURIComponent(url.qs[k])
	}).join('&')

	urlString = urlString ? url.url + '?' + urlString : url.url
 */

function createEnvelope(response, body, res) {

	debugger
	return {
		reqURL: response.request.href,
		reqMethod: response.request.method,
		reqHeaders: response.request.headers,

		body: body,
		headers: response.headers,
		status: response.statusCode + ' ' + response.statusMessage
	}

}

APICache.prototype.onResponse = function(response, req, res) {
	var body

	if( response.headers['content-encoding'] === 'gzip' ) {
		body = []
		response.on('data', function (data) {
			// Data is Buffer, when gzip
			body.push.apply(body, data.toJSON().data)
		})
	} else {
		body = ''
		response.on('data', function (data) {
			body += data
		})
	}

	response.on('end', function () {
		console.log('BODY: ' + body)
		console.log('res headers', response.headers)
		console.log('method', response.method)
		console.log('statusCode', response.statusCode)
		// TODO
		console.log('response', response)

		console.log( createEnvelope(response, body, res) )
	})
}

APICache.prototype.onError = function() {

}

APICache.prototype.onData = function() {
	debugger
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
