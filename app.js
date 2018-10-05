'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point"
const util = require('./Lib/utils.js')

class PointApp extends Homey.App {

    onInit() {
        this.utils = new util();
		this.log('PointApp is running...');
		this.utils.logtoall("Main","App Started")
	}
    log(Text) {
        this.utils.logtoall("",Text)
    }
}

module.exports = PointApp;