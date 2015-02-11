var utf8 = require('utf8');
var crypto = require('crypto');
var request = require('request');

var serialize_params = function (params) {
    var par_lst = [];
    Object.keys(params).forEach(function(k) {
        this.push(
            k + '=' +
            ((typeof params[k] === 'object') ? JSON.stringify(params[k]) : params[k])
        );
    }, par_lst);
    par_lst.sort();
    return par_lst.join('&');
}

var sign = function(auth, method, path, params, payload, expires) {
    var exp_str = new Date((new Date()).getTime() + 1000 * (expires || 60)).toISOString();
    params.key = auth.app_key;
    params.token = auth.app_token;
    params.expires = exp_str;
    var to_sign = [
        method, path,
        crypto.createHash('md5').update(serialize_params(params)).digest('hex'),
        crypto.createHash('md5').update(utf8.encode(payload) || '').digest('hex'),
        auth.app_token, exp_str
    ].join('\n');
    params.sign = crypto.createHmac('sha1', auth.app_secret).update(to_sign).digest('base64');
};

var signed_s3_url = function (bucket, aws_key, aws_secret, aws_token, key, expires) {
  var str = 'GET\n\n\n' + expires + '\nx-amz-security-token:' + aws_token + '\n/' + bucket + '/' + key,
      str_hash = crypto.createHmac('sha1', aws_secret).update(str).digest('base64'),
      query = '?Expires=' + expires + '&AWSAccessKeyId=' + aws_key +
      '&Signature=' + encodeURIComponent(str_hash) + '&x-amz-security-token=' + encodeURIComponent(aws_token);

  return 'https://s3-eu-west-1.amazonaws.com/' + bucket + '/' + key + query;
};

var Client = function (uri, options) {
    this.uri = uri;
    this.options = options || {};
    this.logout();
};

Client.prototype.logout = function () {
    this.auth = null;
    this.email = null;
    this.company = null;
};

Client.prototype.login = function (email, password, callback) {
    request({
        uri: this.uri + '/session',
        method: "POST",
        headers: {"GC-Email": email, "GC-Password": password, 'GC-AWS': !!this.options.use_aws}
    }, (function (client) {
        return function(error, response, body) {
            if (error) {
                console.error(error);
            } else if (response.statusCode != 200) {
                console.warn(response.statusCode);
                console.warn(body);
            } else {
                var r = JSON.parse(body);
                if (r.email) {
                    client.email = r.email;
                    client.auth = r.auth;
                    client.company = r.company
                    if (callback) {
                        callback();
                    }
                } else {
                    console.warn("Authentication failed.");
                }
            }
        }
    })(this)
    );
};

Client.prototype.http = function (method, endpoint) {
    var params = {}, data = '', callback = function () {};
    if (typeof arguments[2] === 'function') {
        // DELETE, or GET with no params
        callback = arguments[2];
    } else if (typeof arguments[3] === 'function') {
        if (method === 'GET') {
            // GET with params
            params = arguments[2];
            callback = arguments[3];
        } else if (['PUT', 'POST'].indexOf(method) != -1) {
            // PUT or POST with data and without params
            data = arguments[2];
            callback = arguments[3];
        }
    } else if (typeof arguments[4] === 'function') {
        // PUT, PATCH, POST with data and params
        params = arguments[2];
        data = arguments[3];
        callback = arguments[4];
    } else {
        // anything, with no callback
        params = arguments[2] || {};
        data = arguments[3] || '';
    }

    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }
    sign(this.auth, method, endpoint, params, data);
    var uri = this.uri + endpoint;
    if (Object.keys(params).length) {
        uri += '?' + serialize_params(params);
    }
    request({
        uri: uri,
        method: method,
        headers: {"Content-Type": "application/json"},
        body: data
    }, function (error, response, body) {
        if (error) {
            console.error(error);
        } else if (response.statusCode < 200 || response.statusCode >= 300) {
            console.warn(response.statusCode);
            console.warn(body);
        } else {
            callback(method !== 'DELETE' ? JSON.parse(body) : {});
        }
    });
};

Client.prototype.get = function (endpoint, params, callback) {
    this.http('GET', endpoint, params, callback);
}
Client.prototype.put = function (endpoint, params, data, callback) {
    this.http('PUT', endpoint, params, data, callback);
};
Client.prototype.post = function (endpoint, params, data, callback) {
    this.http('POST', endpoint, params, data, callback);
};
Client.prototype.patch = function (endpoint, params, data, callback) {
    this.http('PATCH', endpoint, params, data, callback);
};
Client.prototype.delete = function (endpoint, callback) {
    this.http('DELETE', endpoint, callback);
};

Client.prototype.build_url = function (bucket, url_fragment) {
  var expires = Math.floor((new Date(this.auth.expires)).getTime() / 1000);

  return signed_s3_url(bucket, this.auth.access, this.auth.secret, this.auth.token, url_fragment, expires);
};

Client.prototype.build_product_image_url = function (url_fragment) {
  if (!this.auth.buckets) {
    throw new Error('To build image urls you need to enable AWS access on the client...');
  }
  return this.build_url(this.auth.buckets.image, this.auth.user_ns + url_fragment);
};

Client.prototype.build_document_url = function (url_fragment) {
  if (!this.auth.buckets) {
    throw new Error('To build document urls you need to enable AWS access on the client...');
  }
  return this.build_url(this.auth.buckets.document, this.auth.user_ns + url_fragment);
};

Client.prototype.build_shipping_label_url = function (url_fragment) {
  if (!this.auth.buckets) {
    throw new Error('To build shipping label urls you need to enable AWS access on the client...');
  }
  return this.build_url(this.auth.buckets.shipping_label, url_fragment);
};

module.exports = Client
