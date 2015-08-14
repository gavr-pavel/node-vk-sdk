'use strict';

var Promise = require('promise'),
    https = require('https'),
    urlLib = require('url'),
    querystring = require('querystring');


var _delayed = [],
    _token,
    _apiVersion = '5.37';


module.exports.setToken = function (token) {
    _token = token;
    return this;
};


module.exports.setVersion = function (apiVersion) {
    _apiVersion = apiVersion;
    return this;
};


module.exports.getAuthUrl = function (params) {

    var params = params || {};

    params.v = params.v || _apiVersion;

    var options = {
        protocol: 'https',
        hostname: 'oauth.vk.com',
        pathname: '/authorize',
        query: params
    };

    return urlLib.format(options);

};


module.exports.serverAuth = function (params) {

    return new Promise(function (resolve, reject) {

        var options = {
            protocol: 'https',
            hostname: 'oauth.vk.com',
            pathname: '/access_token',
            query: {
                client_id: params.client_id,
                client_secret: params.client_secret,
                grant_type: 'client_credentials',
                v: params.v || _apiVersion
            }
        },
            url = urlLib.format(options);

        getRequest(url, function (response) {
            var data = JSON.parse(response || null);
            if (data.access_token) {
                exports.setToken(data.access_token);
                resolve(data);
            } else {
                reject(data);
            }
        });

    });

};


module.exports.siteAuth = function (params) {

    return new Promise(function (resolve, reject) {

        var options = {
            protocol: 'https',
            hostname: 'oauth.vk.com',
            pathname: '/access_token',
            query: {
                client_id: params.client_id,
                client_secret: params.client_secret,
                redirect_uri: params.redirect_uri,
                code: params.code           
            }
        },
            url = urlLib.format(options);

        getRequest(url, function (response) {
            var data = JSON.parse(response || null);
            if (data.access_token) {
                exports.setToken(data.access_token);
                resolve(data);
            } else {
                reject(data);
            }
        });

    });

};


module.exports.callMethod = function (method, params) {

    return new Promise(function (resolve, reject) {

        apiRequest(method, params, function (data) {

            if (data.response) {
                resolve(data.response);
            } else {
                reject(data.error)
            }

        });

    });



};


module.exports.appendCall = function (method, params) {

    return new Promise(function (resolve, reject) {
        _delayed.push({
            method: method,
            params: params,
            resolve: resolve,
            reject: reject
        });
    });

};


module.exports.execute = function (captcha) {

    return new Promise(function (resolve, reject) {

        var calls = _delayed;
        _delayed = [];

        var code = 'return [' + calls.map(function (item) {
            return 'API.METHOD(PARAMS)'
                .replace('METHOD', item.method)
                .replace('PARAMS', JSON.stringify(item.params) || '');
        }).join(',') + '];';

        var params = {
            code: code
        };

        if (captcha) {
            params.captcha_sid = captcha.sid;
            params.captcha_key = captcha.key;
        }

        apiRequest('execute', params, function onResponse (data) {

            var errorsHandled = 0;

            if (data.response) {

                resolve(data.response);
                data.response.forEach(function (response, i) {
                    var call = calls[i];
                    if (response) {
                        call.resolve(response);
                    } else {
                        call.reject(data.execute_errors[errorsHandled++]);
                    }
                });

            } else {

                reject(data.error);
                calls.forEach(function (item) {
                    item.reject(data.error);
                });

            }

        });

    });


};


function apiRequest (method, params, callback) {

    https.request({
        hostname: 'api.vk.com',
        port: 443,
        path: '/method/' + method,
        method: 'POST'
    }, function (res) {
        var json = '';
        res.on('data', function (chunk) {
            json += chunk;
        })
        .on('end', function () {
            callback(JSON.parse(json || '{}'));
        });
    })
    .on('error', function () {
        // TODO
    })
    .end(makeQueryString(params));

}


function getRequest (url, callback) {

    https.get(url, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        })
        .on('end', function () {
            callback(data);
        });
    })
    .on('error', function () {
        // TODO
    });

}


function makeQueryString (params) {
    var params = params || {};
    params.access_token = _token;

    return querystring.stringify(params);
}