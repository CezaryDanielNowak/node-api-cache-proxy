'use strict'
var assert = require('assert')
var extract = require('url-querystring')
var filendir = require('filendir')
var MD5 = require("crypto-js/md5");
var objectAssign = require('object-assign')
var omit = require('object.omit')
var path = require('path')
var request = require('request')
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

	// content is unpacked, content-encoding doesn't apply anymore
	var headers = omit(response.headers, 'content-encoding')

	return {
		reqURL: this._clearURLParams(response.request.href),
		reqMethod: response.request.method,
		reqHeaders: response.request.headers,
		reqBody: '',

		body: body,
		headers: headers,
		statusCode: response.statusCode,
		statusMessage: response.statusMessage
	}

}

APICache.prototype.onResponse = function(response, req, res) {
	var body = []

	response.on('data', function(chunk) {
		// Data is Buffer when gzip, text when not-gzip
		body.push(chunk)
	})

	response.on('end', function () {
		// Thanks, Nick Fishman
		// http://nickfishman.com/post/49533681471/nodejs-http-requests-with-gzip-deflate-compression
		var encoding = response.headers['content-encoding']
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

/**
 * clearURL takes url string as input and remove parameters, that are
 * listed in config.excludeRequestParams
 * @param	{string} href
 * @return {string}
 */
APICache.prototype._clearURLParams = function(href) {
	var url = extract(href)
	var queryObj = omit(url.qs, this.config.excludeRequestParams)

	var urlString = Object.keys(queryObj).map(function (paramName) {
		return paramName + '=' + encodeURIComponent(queryObj[paramName])
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

/**
 * Save request to file
 * @param	{object} envelope
 * @return {none}
 */
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

/**
 * @constructor APICache
 * @param {[type]} config [description]
 */
function APICache(config) {
	assert(config, 'APICache requres config provided')
	assert(config.cacheDir, 'APICache: provide cacheDir')
	assert(config.excludeRequestHeaders, 'APICache: provide excludeRequestHeaders')
	assert(config.apiUrl, 'APICache: provide apiUrl')

	this.config = objectAssign({}, defaultConfig, config)

	this.onError = APICache.prototype.onError.bind(this)
	this.onResponse = APICache.prototype.onResponse.bind(this)

	var handleRequest = function(req, res, next, configOverride) {
		var newConfig = objectAssign({}, this.config, configOverride || {})

		var url = req.url.split('/')
		url.splice(0, 3) // remove local protocol and domain part
		url.unshift(newConfig.apiUrl.replace(/\/+$/, '')) // push destination api url
		url = url.join('/')
		debugger
		if (newConfig.localURLReplace) {
			url = newConfig.localURLReplace(url)
		}

		var apiReq = request(url)
			.on('response', function(response) {
				this.onResponse(response)
			}.bind(this))
			.on('error', function(err) {
				this.onError(err, req, res)
			}.bind(this))

		req.pipe(apiReq).pipe(res)

		return apiReq
	}

	return objectAssign(handleRequest.bind(this), this)
}

module.exports = APICache
