'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')
//const PointAPI = require('../../Lib/Api')
//const Hook = require('../../Lib/Webhook')
const PointDevice = require('./device.js');
const OAuth2Driver = require('homey-wifidriver').OAuth2Driver;

const oauth2ClientConfig = {
    url: `https://api.minut.com/v1/oauth/authorize?client_id=${Homey.env.CLIENT_ID}&response_type=code&redirect_uri=https://callback.athom.com/oauth2/callback`,
    tokenEndpoint: `https://api.minut.com/v1/oauth/token`,
    key: Homey.env.CLIENT_ID,
    secret: Homey.env.CLIENT_SECRET,
    allowMultipleAccounts: true,
};

const API_BASE_URL = 'https://api.minut.com/v1/';

class Point extends OAuth2Driver  {

    async onInit() {

        // Start OAuth2Client
        await super.onInit({ oauth2ClientConfig });
        this.log(`Authorizeurl = ${oauth2ClientConfig.url}`);
    }

	/**
	 * The method will be called during pairing when a list of devices is needed. Only when this class
	 * extends WifiDriver and provides a oauth2ClientConfig onInit. The data parameter contains an
	 * temporary OAuth2 account that can be used to fetch the devices from the users account.
	 * @returns {Promise}
	 */
    onPairOAuth2ListDevices() {
        return this.apiCallGet({ uri: `${API_BASE_URL}devices` })
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

	/**
	 * Always use ToonDevice as device for this driver.
	 * @returns {PointDevice}
	 */
    mapDeviceClass() {
        return PointDevice;
    }

}

module.exports = Point;