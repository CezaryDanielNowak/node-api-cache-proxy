Node API Cache Proxy
======
When API is down, work may be hard for front-end developer.
Configure api cache to mock REST API responses.

API not responding.

![API not responding.](docs/OqWCFTn.gif)

How it works?
------
- Spy for API calls
- Save responses depending on address, headers and request payload
- Serves cached data, when API is down


How to use
------

Sample using Express:
```
var express = require('express')
var APICacheProxy = require('node-api-cache-proxy')

var app = express()
var apiCache = new APICacheProxy({
	apiUrl: config.testServer.apiBaseUrl,
	cacheDir: 'cache-api/',
	excludeRequestHeaders: [
		'Cookie', 'User-Agent', 'User-Agent', 'Referer', 'Origin', 'Host', 'DNT'
	],
	excludeRequestParams: ['_'],
	isValidResponse: function(requestEnvelope) {
		// this is default validation function, feel free to override it
		if (requestEnvelope.statusCode === 200) {
			return true;
		} else {
			return false;
		}
	},
	localURLReplace: function(url) {
		return url.replace('/api/', '')
	}
})

app.use('/api', apiCacheProxy)
```


API
------
`var apiCache = new APICache(config)`, config:
- `apiUrl` {string, required}: Directory to save requests
- `cacheDir` {string, required}: Directory to save requests
- `excludeRequestHeaders` {array, required}: headers to ommit when writing or reading cache file
- `excludeRequestParams` {array}: usually cache parameter from your request address
- `localURLReplace(url: string)` {function}: prepare url to API
- `isValidResponse` {function(requestEnvelope: Object)}: Check if API response is valid or not.
    - when `true` is returned, request will be saved and ready to use
    - when `false` is returned, request won't be saved and cache entry will be
      served instead (if available)

`requestEnvelope` sample:
```
	{
		reqURL: 'http://my-api.local/method/route?action=sth',
		reqMethod: 'GET',
		reqHeaders: response.request.headers,
		reqBody: 'request=a&body=is&just=for&POST=:)',

		body: body,
		headers: response.headers,
		statusCode: response.statusCode,
		statusMessage: response.statusMessage,

		cacheDate: "2015-11-30 01:35:53"
	}
```

Error Handling
------
Custom error handler, executed when API response doesn't pass
`isValidResponse` test, and there is no cached response:
```
var apiCache = new APICacheProxy({...})
var app = express()

app.use('/api', function(req, res, next) {
	apiCacheProxy(req, res, next).catch(function(envelope) {
		res.status(envelope.statusCode).send(
			'<pre>' + envelope.body + '</pre>'
		)
	})
})
```

Handle case, when API response doesn't pass `isValidResponse` test but there is
cached response:
```
var apiCache = new APICacheProxy({...})
var app = express()

app.use('/api', function(req, res, next) {
	apiCacheProxy(req, res, next).then(function(status, envelope) {
		if (status.dataSource === 'Cache') {
			console.warn('[' + envelope.method + '] ' + envelope.reqURL)
			console.warn('  API failure. Served: ' + status.filePath)
		}
	})
})
```


API data format support table
------

| Feature               | Support       |
| --------------------- | ------------- |
| text content          | Yes           |
| deflate-text content  | Yes           |
| gzip-text content     | Yes           |
| binary content        | No            |
| https                 | Yes           |
| POST, GET, PUT, ...   | Yes           |
