﻿'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')
const PointDevice = require('./device.js');
//const OAuth2Driver = require('homey-wifidriver').OAuth2Driver;
const { OAuth2Driver } = require('homey-oauth2app');


class PointHome extends OAuth2Driver {

    async onOAuth2Init() {
      this.log('Initializing PointHome');
    }

	/**
	 * The method will be called during pairing when a list of devices is needed. Only when this class
	 * extends WifiDriver and provides a oauth2ClientConfig onInit. The data parameter contains an
	 * temporary OAuth2 account that can be used to fetch the devices from the users account.
	 * @returns {Promise}
	 */
    async onPairListDevices({ oAuth2Client }) {
      const points = await oAuth2Client.getHomes()
      return result.homes.map(home => ({
          name: home.name,
          data: {
              id: home.home_id,
          },
      }));
    }

	/**
	 * Always use ToonDevice as device for this driver.
	 * @returns {PointHome}
	 */
    mapDeviceClass() {
        return PointHome;
    }

}

module.exports = PointHome;
