Node API Cache
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
	},
	apiUrl: config.testServer.apiBaseUrl,
	localURLReplace: function(url) {
		return url.replace('/api/', '')
	}
})

app.use('/api', function (req, res, next) {
  process.stdout.write('🐷  ')
  apiCacheProxy(req, res, next).on('error', function(err) {
    errorHandler(err, req, res, next)
  })
})
```


API
------
`var apiCache = new APICache(config)`, config:
- `apiUrl` {string, required}: Directory to save requests
- `cacheDir` {string, required}: Directory to save requests
- `excludeRequestHeaders` {array, required}: headers to ommit when writing or reading cache file
- `excludeRequestParams` {array}: usually cache parameter from your request
- `localURLReplace(url: string)` {function}: prepare url to API
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
