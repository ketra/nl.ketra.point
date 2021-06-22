const Homey = require('homey');
const utils = require('../../Lib/utils');
const { OAuth2Device, OAuth2Token, OAuth2Util } = require('homey-oauth2app');
const POLL_INTERVAL = 3600 * 1000;

const actions = {
  temperature: "measure_temperature",
  humidity: "measure_humidity",
  pressure: "measure_pressure",
  sound_level: "measure_noise",
  part_als: "measure_luminance",
}

class MinutDevice extends OAuth2Device {

    async onOAuth2Init() {
        this.log('init PointDevice');
        if (this.hasCapability("measure_pressure")) {
            this.homey.app.mylog("Remove Measure pressure from device")
            this.removeCapability("measure_pressure").then(this.log).catch(this.error);
        }
        if (this.hasCapability("measure_luminance")) {
            this.homey.app.mylog("Remove luminance from device")
            this.removeCapability("measure_luminance").then(this.log).catch(this.error);
        }
        this.readyDevice();
    }

    async readyDevice() {
        this.id = this.getData().id;
        await this.oAuth2Client.register_device(this);
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), POLL_INTERVAL);
        this.log(`token = ${this.oAuth2Client.getToken().access_token}`);
        this.homey.app.mylog(`token = ${this.oAuth2Client.getToken().access_token}`);
        await this.oAuth2Client.registerWebhookSubscription();
        await this.oAuth2Client.RegisterFlows();
        //this._GetStateInfo();
    }
    unreadyDevice() {
        this.log('Cleared Timeout');
        clearTimeout(this.GetStatusInterval);
    }

    // onOAuth2Migrate() {
    //     this.log('onOAuth2Migrate()');
    //     const oauth2AccountStore = this.getStoreValue('oauth2Account');
    //
    //     if (!oauth2AccountStore)
    //         throw new Error('Missing OAuth2 Account');
    //     if (!oauth2AccountStore.accessToken)
    //         throw new Error('Missing Access Token');
    //     if (!oauth2AccountStore.refreshToken)
    //         throw new Error('Missing Refresh Token');
    //
    //     const token = new OAuth2Token({
    //         access_token: oauth2AccountStore.accessToken,
    //         refresh_token: oauth2AccountStore.refreshToken,
    //     });
    //
    //     const sessionId = OAuth2Util.getRandomId();
    //     const configId = this.getDriver().getOAuth2ConfigId();
    //     this.log('onOAuth2Migrate() -> migration succeeded', {
    //         sessionId,
    //         configId,
    //         token,
    //     });
    //
    //     return {
    //         sessionId,
    //         configId,
    //         token,
    //     };
    // }
    // onOAuth2Deleted() {
    //     this.oAuth2Client.delete_device(this);
    // }
    //
    // onOAuth2MigrateSuccess() {
    //     this.unsetStoreValue('token');
    // }

    async _GetStateInfo() {
        this.log(`processing Data for PointDevice ${this.id}`);
        this.homey.app.mylog(`processing Data for PointDevice ${this.id}`);
        //for (let action in actions) {
        //    this._GetDataForAction(action, actions[action]);
        //}
        this._GetGeneralData();
    }

    async _GetDataForAction(action, capability) {
         let datum = new Date();
         datum.setHours(datum.getHours() - 1);
         let path = `devices/${this.id}/${action}?start_at=${datum.toISOString()}`

         this.oAuth2Client.getDeviceData(path).then((data) => {
             if (Array.isArray(data.values) && data.values.length > 0) {
                 var value = data.values[data.values.length - 1]
                 let collectiontime = new Date(value.datetime);
                 this.log(`Collecting ${action}  With Date ${collectiontime.toLocaleString()} And value ${value.value}`);
                 this.homey.app.mylog(`Collecting ${action}  With Date ${collectiontime.toLocaleString()} And value ${value.value}`);
                 this.setCapabilityValue(capability, parseFloat(value.value));
             } else {
                 this.log(`No Data found for ${action}`);
                 this.homey.app.mylog(`No Data found for ${action}`);
             }
         });
     }

    async _GetGeneralData() {

        this.log(`Collecting data for ${this.id}`)
        let path = `devices/${this.id}`;
        this.oAuth2Client.getDeviceData(path).then((data) => {
            console.log(data)
			this.setCapabilityValue('measure_temperature', parseFloat(data.latest_sensor_values.temperature.value))
            this.log(`Set temperature to ${data.latest_sensor_values.temperature.value}`)
            this.setCapabilityValue('measure_humidity', parseFloat(data.latest_sensor_values.humidity.value))
            this.log(`Set humidity to ${data.latest_sensor_values.humidity.value}`)
            this.setCapabilityValue('measure_noise', parseFloat(data.latest_sensor_values.sound.value))
            this.log(`Set noise to ${data.latest_sensor_values.sound.value}`)
            this.setCapabilityValue('measure_battery', parseFloat(data.battery.percent))
            this.log(`Set batery to ${data.battery.percent}`)

            if (data.ongoing_events.includes("avg_sound_high"))
                this.setCapabilityValue('alarm_Noise', true);
            else
                this.setCapabilityValue('alarm_Noise', false);
            if (data.ongoing_events.includes('temperature_high') || data.ongoing_events.includes('temperature_low'))
                this.setCapabilityValue('alarm_Temp', true);
            else
                this.setCapabilityValue('alarm_Temp', false);
            if (data.ongoing_events.includes('humidity_high') || data.ongoing_events.includes('humidity_low'))
                this.setCapabilityValue('alarm_Hum', true);
            else
                this.setCapabilityValue('alarm_Hum', false);

            this.setCapabilityValue('alarm_motion', false);

            //this._GetDataForAction('pressure', "measure_pressure")
        }).catch((err) => {
            this.log(`Error: ${err}`)
        });
    }

    async resetOAuth2Client({ sessionId, configId }) {

        // Store updated client config
        await this.setStoreValue('OAuth2SessionId', sessionId);
        await this.setStoreValue('OAuth2ConfigId', configId);

        // Check if client exists then bind it to this instance
        let client;
        if (this.homey.app.hasOAuth2Client({ configId, sessionId })) {
            client = this.homey.app.getOAuth2Client({ configId, sessionId });
        } else {
            this.error('OAuth2Client reset failed');
            return this.setUnavailable(Homey.__('authentication.re-login_failed'));
        }

        // Rebind new oAuth2Client
        this.oAuth2Client = client;
        this.log(`Bound new client setting availible`);
        this.homey.app.mylog(`Bound new client setting availible`);



        return this.setAvailable(this.readyDevice());
    }
}
module.exports = MinutDevice;
