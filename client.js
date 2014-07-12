var crypto = require('crypto');
var request = require('request');  // https://github.com/mikeal/request

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

var sign = function(auth, verb, path, params, payload, expires) {
    var exp_str = new Date((new Date()).getTime() + 1000 * (expires || 60)).toISOString();
    params.key = auth.app_key;
    params.token = auth.app_token;
    params.expires = exp_str;
    var to_sign = [
        verb, path,
        crypto.createHash('md5').update(serialize_params(params)).digest('hex'),
        crypto.createHash('md5').update(payload || '').digest('hex'),
        auth.app_token, exp_str
    ].join('\n');
    params.sign = crypto.createHmac('sha1', auth.app_secret).update(to_sign).digest('base64');
};

var Client = function (uri) {
    this.uri = uri;
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
        headers: {"GC-Email": email, "GC-Password": password}
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

Client.prototype.http = function (verb, endpoint, params, data, callback) {
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }
    sign(this.auth, verb, endpoint, params, data);
    var uri = this.uri + endpoint;
    if (Object.keys(params).length) {
        uri += '?' + serialize_params(params);
    }
    request({
        uri: uri,
        method: verb,
        headers: {"Content-Type": "application/json"},
        body: data
    }, function (error, response, body) {
        if (error) {
            console.error(error);
        } else if (response.statusCode < 200 || response.statusCode >= 300) {
            console.warn(response.statusCode);
            console.warn(body);
        } else if (callback) {
            callback(verb !== 'DELETE' ? JSON.parse(body) : {});
        }
    });
};

Client.prototype.get = function (endpoint, params, callback) {
    var verb = 'GET', data = '';
    this.http(verb, endpoint, params, data, callback);
}
Client.prototype.put = function (endpoint, params, data, callback) {
    var verb = 'PUT';
    this.http(verb, endpoint, params, data, callback);
};
Client.prototype.post = function (endpoint, params, data, callback) {
    var verb = 'POST';
    this.http(verb, endpoint, params, data, callback);
};
Client.prototype.patch = function (endpoint, params, data, callback) {
    var verb = 'PATCH';
    this.http(verb, endpoint, params, data, callback);
};
Client.prototype.delete = function (endpoint, callback) {
    var verb = 'DELETE', params = {}, data = '';
    this.http(verb, endpoint, params, data, callback);
};

module.exports = Client
