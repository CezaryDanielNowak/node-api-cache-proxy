Node API Cache Proxy
======
When API is down, work may be hard for front-end developer.
Configure api cache to fallback REST API responses.


![API not responding.](docs/OqWCFTn.gif)
“API not responding”


How it works?
------
- Works as middleware for API calls
- Save responses depending on address, headers and request payload
- Serves cached data, when API is down


How to use
------
Minimal using Express:
```js
var express = require('express')
var APICacheProxy = require('node-api-cache-proxy')

var app = express()
var apiCacheProxy = new APICacheProxy({
	apiUrl: 'http://destination-api-url.com',
	cacheDir: 'cache-api/',
	localURLReplace: function(url) {
		return url.replace('/api/', '/')
	}
})

app.use('/api', apiCacheProxy)
```

Sample using Express:
```js
var express = require('express')
var APICacheProxy = require('node-api-cache-proxy')

var app = express()
var apiCacheProxy = new APICacheProxy({
	apiUrl: 'http://destination-backend-url.com',
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
		return url.replace('/api/', '/')
	}
})

app.use('/api', apiCacheProxy)
```


API
------
`var apiCache = new APICache(config)`, config:
- `cacheEnabled` {boolean}: When false, plugin will work as proxy, without caching.
- `apiUrl` {string, required}: Proxy replaces protocol, domain part with apiUrl
- `cacheDir` {string}: Directory to save requests
- `excludeRequestHeaders` {array}: headers to omit when writing or reading cache file
- `excludeRequestParams` {array}: usually cache parameter from your request address
- `localURLReplace(url: string)` {function}: prepare url to API
- `isValidResponse` {function(requestEnvelope: Object)}: Check if API response is valid or not.
    - when `true` is returned, request will be saved and ready to use
    - when `false` is returned, request won't be saved and cache entry will be
      served instead (if available)
- `timeout` {object}:  Milliseconds, helps terminating requests for really slow backends.


`requestEnvelope` format:
------
```
	{
		reqURL: 'http://my-api.local/method/route?action=sth',
		reqMethod: 'POST',
		reqHeaders: response.request.headers,
		reqBody: 'request=a&body=is&just=for&POST=PUT,etc:)',

		body: body,
		headers: response.headers,
		statusCode: response.statusCode,
		statusMessage: response.statusMessage,

		cacheDate: "2015-11-30 01:35:53",
		version: "0.6.1"
	}
```

Error Handling
------
Custom error handler, executed when API response doesn't pass
`isValidResponse` test, and there is no cached response:
```js
var apiCache = new APICacheProxy({...})
var app = express()

app.use('/api', function(req, res, next) {
	apiCacheProxy(req, res, next).catch(function(requestEnvelope) {
		res.status(requestEnvelope.statusCode).send(
			'<pre>' + requestEnvelope.body + '</pre>'
		)
	})
})
```

Handle case, when API response doesn't pass `isValidResponse` test but there is
cached response:
```js
var apiCache = new APICacheProxy({...})
var app = express()

app.use('/api', function(req, res, next) {
	apiCacheProxy(req, res, next).then(function(status) {
		if (status.dataSource === 'Cache') {
			console.warn('[' + status.envelope.reqMethod + '] ' + status.envelope.reqURL)
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

Requirements
------
This module is maintained on node v0.12.7. It may work on older and newer node
versions. Feel free to test and send me a feedback :-)
