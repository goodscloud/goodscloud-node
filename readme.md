# GoodsCloud API client in JavaScript for Node.js

## Installation

Install the latest stable release of this module from [npmjs.org](https://www.npmjs.org/package/goodscloud):

    npm install goodscloud

Or install the development version from [github.com](https://github.com/goodscloud/goodscloud-node) with:

    npm install git+https://github.com/goodscloud/goodscloud-node.git

### Requirements

This package depends on the [utf8](https://www.npmjs.org/package/utf8) package and the [request](https://www.npmjs.org/package/request) package by [Mikeal Rogers](https://github.com/mikeal). These should be downloaded and installed by `npm` when installing this package, but if they are not, install them with:

    npm install utf8
    npm install request

## Usage

Use the client like this:

```javascript
var Client = require('goodscloud');
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

Function calls corresponding to `HTTP` method verbs have different optional arguments. In all cases, providing a `callback` is optional. If no `callback` is provided, the request will be executed but the response data will be discarded.

 * `Client.get()` allows the following call signatures:
    * `get(endpoint);`
    * `get(endpoint, params);`
    * `get(endpoint,         callback);`
    * `get(endpoint, params, callback);`
 * `Client.put()` and `Client.post()` always require a `data` argument to be provided. They allow the following call signatures:
    * `func(endpoint,         data);`
    * `func(endpoint, params, data);`
    * `func(endpoint,         data, callback);`
    * `func(endpoint, params, data, callback);`
 * `Client.patch()` always requires both `params` and `data` arguments to be provided. It allows the following call signatures:
    * `patch(endpoint, params, data);`
    * `patch(endpoint, params, data, callback);`
 * `Client.delete()` allows the following call signatures:
    * `delete(endpoint);`
    * `delete(endpoint, callback);`

### Accessing product images

Product images are stored on AWS S3. By default API client doesn't get AWS credentials issued. To get AWS enabled client set `use_aws` option to `true` when instantiating the client:

```javascript
var Client = require('goodscloud');
var c = new Client('http://sandbox.goodscloud.com', {use_aws: true});
c.login('me@mycompany.com', 'PASSWORD',
  function () {
    var params = {
      results_per_page: 1
    };

    c.get('/api/internal/product_image', params, function (data) {
      var product_image = data.objects[0];
      console.log(c.build_product_image_url(product_image.url_fragment));
    });
  }
);
```

## Releasing a new version:

Release a new version like this:

 1. Update the version number in `package.json`
 2. Log in to npmjs.org with `npm adduser`
 3. Publish the package with `npm publish`
