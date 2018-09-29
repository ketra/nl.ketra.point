'use strict';

const Homey = require('homey');
const axios = require('axios')

class util {

    logtoall(action, text) {
        var d = new Date();
        console.log(d.toLocaleString() + " - " + text)
        Homey.ManagerApi.realtime(action, text)
    }

}
module.exports = util
