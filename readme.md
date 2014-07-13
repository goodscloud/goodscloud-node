# GoodsCloud API client in JavaScript for Node.js

## Requirements

This package depends on the [request](https://github.com/mikeal/request) package by [Mikeal Rogers](https://github.com/mikeal). Install request with:

    npm install request

## Usage

Use the client like this:

```javascript
var Client = require('./goodscloud');
var c = new Client('http://sandbox.goodscloud.com');
c.login('me@mycompany.com', 'PASSWORD',
    function () {
        console.info("Logged in as", c.email);
        c.get('/api/internal/company', {flat: true}, function (data) {
            console.info(data);
        });
    }
);
```

### Call signatures

Function calls corresponding to `HTTP` method verbs have different default and optional arguments.

 * `Client.get()` allows the following call signatures:
    * `get(endpoint);`
    * `get(endpoint, params);`
    * `get(endpoint,         callback);`
    * `get(endpoint, params, callback);`
 * `Client.put()`, `Client.post()`, and `Client.patch()` always require a `data` argument to be provided. They allow the following call signatures:
    * `func(endpoint,         data);`
    * `func(endpoint, params, data);`
    * `func(endpoint,         data, callback);`
    * `func(endpoint, params, data, callback);`
 * `Client.delete()` allows the following call signatures:
    * `delete(endpoint);`
    * `delete(endpoint, callback);`

In all cases, `callback` is optional. If no `callback` is provided, the request will be executed but the response data will be discarded.

