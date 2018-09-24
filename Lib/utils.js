'use strict';

const Homey = require('homey');

module.exports.logtoall = function logtoall(action, text) {
    var d = new Date();
    console.log(d.toLocaleString() + " - " + text)
    Homey.ManagerApi.realtime(action, text)
}