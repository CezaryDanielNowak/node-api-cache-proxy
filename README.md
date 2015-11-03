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
	excludeRequestParams: ['_'],
	isValid: function(requestEnvelope) {
		// this is default validation function, feel free to override it
		if (requestEnvelope.statusCode === 200) {
			return true;
		} else {
			return false;
		}
	}
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
- `cacheDir` {string, required}: Directory to save requests
- `excludeRequestHeaders` {array, required}: headers to ommit when writing or reading cache file
- `excludeRequestParams` {array}: usually cache parameter from your request
- `isValid` {function(requestEnvelope: Object)}: Check if API response is valid or not.
    - when `true` is returned, request will be saved and ready to use
    - when `false` is returned, request won't be saved and cache entry will be
      served instead (if available)

`apiCache.onResponse(response, req, res)`

`apiCache.onError(error, req, res, callback)`

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
		statusMessage: response.statusMessage
	}
```
