'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')

class Point extends Homey.Driver  {

    onPair(socket) {
        var utils = new util()
        utils.startOath(socket);

    }

}
module.exports = Point;