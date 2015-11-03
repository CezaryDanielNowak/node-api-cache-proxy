'use strict'
var assert = require('assert')
var extract = require('url-querystring')
var filendir = require('filendir')
var MD5 = require("crypto-js/md5");
var objectAssign = require('object-assign')
var path = require('path')
var sanitize = require('sanitize-filename')
var zlib = require('zlib')

var moduleName = 'node-api-cache'

var defaultConfig = {
	cacheDir: '',
	excludeRequestHeaders: [],
	excludeRequestParams: [],
	isValid: function(envelope) {
		if (envelope.statusCode === 200) {
			return true
		} else {
			return false
		}
	}
}

APICache.prototype._createEnvelope = function(response, body, res) {
	// TODO: add request body for POST
	// TODO: parse excludeRequestHeaders before saving request body (POST)
	return {
		reqURL: this._clearURL(response.request.href),
		reqMethod: response.request.method,
		reqHeaders: response.request.headers,
		reqBody: '',

		body: body,
		headers: response.headers,
		statusCode: response.statusCode,
		statusMessage: response.statusMessage
	}

}

APICache.prototype.onResponse = function(response, req, res) {
	var body = []

	var encoding = response.headers['content-encoding']
	response.on('data', function(chunk) {
		// Data is Buffer, when gzip
		body.push(chunk)
	})

	response.on('end', function () {
		// Thanks, Nick Fishman
		// http://nickfishman.com/post/49533681471/nodejs-http-requests-with-gzip-deflate-compression
		var buffer = Buffer.concat(body)
		if (encoding === 'gzip') {
			body = zlib.gunzipSync(buffer)
		} else if (encoding == 'deflate') {
			body = zlib.inflateSync(buffer)
		}
		body = body && body.toString()

		var envelope = this._createEnvelope(response, body, res)

		if (this.config.isValid(envelope)) {
			this._saveRequest(envelope)
		}
	}.bind(this))
}

APICache.prototype._clearURL = function(href) {
	var url = extract(href)
	Object.keys(url.qs).forEach(function(paramName) {
		if (this.config.excludeRequestParams.indexOf(paramName) !== -1) {
			delete url.qs[paramName]
		}
	}.bind(this))
	var urlString = Object.keys(url.qs).map(function (paramName) {
		return paramName + '=' + encodeURIComponent(url.qs[paramName])
	}).join('&')

	return urlString ? url.url + '?' + urlString : url.url
}

APICache.prototype._getFileName = function(envelope) {
	var bodyHash = ''
	if(envelope.reqMethod === 'POST') {
		// TODO: create body hash depending on request headers
		bodyHash = ' ' + MD5(JSON.stringify(envelope.reqBody))
	}
	var sanitazedURL = sanitize(envelope.reqURL.replace('://', '-'), {replacement: '-'})
	return envelope.reqMethod + '_' + sanitazedURL + bodyHash +'.tmp'
}

APICache.prototype._saveRequest = function(envelope) {
	var fileName = this._getFileName(envelope)
	var filePath = path.resolve(this.config.cacheDir, fileName)

	filendir.writeFile(filePath, JSON.stringify(envelope), function(err) {
		if(err) {
			console.log('[' + moduleName +'] File could not be saved in ' + this.config.cacheDir)
			throw err
		}
	}.bind(this))
}

APICache.prototype.onError = function() {

}


function APICache(config) {
	assert(config, 'APICache requres config provided')
	assert(config.cacheDir, 'APICache: provide cacheDir')
	assert(config.excludeRequestHeaders, 'APICache: provide excludeRequestHeaders')

	this.config = objectAssign({}, defaultConfig, config)

	this.onError = APICache.prototype.onError.bind(this)
	this.onResponse = APICache.prototype.onResponse.bind(this)
}

module.exports = APICache
