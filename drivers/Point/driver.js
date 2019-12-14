'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')
const PointDevice = require('./device.js');
const {  OAuth2Driver } = require('homey-oauth2app');

module.exports = class Point extends OAuth2Driver {

  onOAuth2Init() {
    this.log('Initializing PointDriver');
  }
  async onPairListDevices({
    oAuth2Client
  }) {
    return oAuth2Client.getDevices()
      .then(result => {
        this.log(`got ${result.devices.length} devices`);
        if (Array.isArray(result.devices)) {
          return result.devices.map(device => ({
            name: device.description,
            data: {
              id: device.device_id,
            },
          }));
        }
        return [];
      })
      .catch(err => {
        this.error('failed to get devices', err.stack);
        throw err;
      });
  }
}
