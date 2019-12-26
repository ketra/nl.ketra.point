'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils');
const PointDevice = require('./device.js');
const { OAuth2Driver } = require('homey-oauth2app');


class PointHome extends OAuth2Driver {

  async onOAuth2Init() {
    this.log('Initializing PointHome');
  }

  async onPairListDevices({
    oAuth2Client
  }) {
      return oAuth2Client.getHomes()
          .then(result => {
              this.log(`got ${result.homes.length} Homes`);
              if (Array.isArray(result.homes)) {
                  return result.homes.map(home => ({
                      name: home.name,
                      data: {
                          id: home.home_id,
                      },
                  }));
              }
              return [];
          });
  }

  mapDeviceClass() {
    return PointHome;
  }

}

module.exports = PointHome;
