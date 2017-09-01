/**
 ┌──────────────────────────────────────────────────────────────┐
 │               ___ ___ ___ ___ ___ _  _ ___ ___               │
 │              |_ _/ _ \_ _/ _ \_ _| \| | __/ _ \              │
 │               | | (_) | | (_) | || .` | _| (_) |             │
 │              |___\___/___\___/___|_|\_|_| \___/              │
 │                                                              │
 │                                                              │
 │                       set up in 2015.2                       │
 │                                                              │
 │   committed to the intelligent transformation of the world   │
 │                                                              │
 └──────────────────────────────────────────────────────────────┘
*/

var _ = require('lodash');
var moment = require('moment');
var eventproxy = require('eventproxy');

var moduel_prefix = 'ec_shopping_cart_index';

exports.register = function(server, options, next) {
    server.route([
        {
            method: 'GET',
            path: '/desc',
            handler: function(request, reply) {
                return reply({"success":true,"message":"ok","desc":"ec shopping cart service","server":server.info.uri});
            },
        },
        
        {
            method: 'GET',
            path: '/',
            handler: function(request, reply) {
                return reply("ioio");
            },
        },
        
    ]);

    next();
}

exports.register.attributes = {
    name: moduel_prefix
};