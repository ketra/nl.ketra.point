'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point";
const util = require('./Lib/utils.js');
//const PointAPI = require('../../Lib/Api');
//const Hook = require('../../Lib/Webhook');

class PointApp extends Homey.App {

    onInit() {
        this.utils = new util();
		this.log('PointApp is running...');
        this.log("Main", "App Started");
    }

    log(Text) {
        this.utils.logtoall("", Text);
    }
}

module.exports = PointApp;