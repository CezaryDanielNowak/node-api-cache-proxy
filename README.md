Node API Cache
======
When API is down, work may be hard for front-end developer.
Configure api cache to mock REST API responses.


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
var APICache = require('node-api-cache')

var app = express()
var apiCache = new APICache({
	cacheDir: 'cache-api/',
	excludeRequestHeaders: [
		'Cookie', 'User-Agent', 'User-Agent', 'Referer', 'Origin', 'Host', 'DNT'
	],
	excludeRequestParams: ['_']
})

app.use('/api', function apiProxy(req, res, next) {
	var url = req.url.replace('/api/', '')

	req
	.pipe(
		request('http://my-backend.local/' + url)
		.on('data', apiCache.onData)
		.on('response', apiCache.onResponse)
		.on('error', function(err) {
			apiCache.onError(err, req, res, function(cacheErr, body) {

			})
		})
	)
	.pipe(res)
})

```


API
------
`var apiCache = new APICache(config)`, config:
- cacheDir: Directory to save requests
- excludeRequestHeaders: headers to ommit when writing or reading cache file
- excludeRequestParams: usually cache parameter from your request

`apiCache.onResponse(response, req)`

`apiCache.onError(error, req, res, callback)`
