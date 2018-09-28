'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point"
const util = require('./Lib/utils.js')

class PointApp extends Homey.App {

    onInit() {
        var utils = new util();
		this.log('PointApp is running...');
		utils.logtoall("Main","App Started")
	}
}

module.exports = PointApp;