'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point"
const util = require('./Lib/utils')

class PointApp extends Homey.App {

	onInit() {
		this.log('PointApp is running...');
		util.logtoall("Main","App Started")
	}
	
}

module.exports = MyApp;