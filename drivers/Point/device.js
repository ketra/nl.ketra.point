const Homey = require('homey');
const utils = require('../../Lib/utils')
//const OAuth2Device = require('homey-wifidriver').OAuth2Device;
const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 60 * 1000;

const actions = {
    temperature: "measure_temperature",
    humidity: "measure_humidity",
    pressure: "measure_pressure",
    sound_level: "measure_noise",
    part_als: "measure_luminance",
}

class point extends OAuth2Device {

   async onOAuth2Init() {
     this.log('init PointDevice');
     this.id = this.getData().id;
     await this.oAuth2Client.register_device(this);
     this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000)
     this.log(`token = ${this.oAuth2Client.getToken().access_token}`)
     await this.oAuth2Client.registerWebhookSubscription();
     await this.oAuth2Client.RegisterFlows();
     this._GetStateInfo();
    }

    onOAuth2Migrate() {
      const store = this.getStore();
      if( store.token ) {
        const token = new OAuth2Token(store.token);
        const sessionId = OAuth2Util.getRandomId();
        const configId = this.getDriver().getOAuth2ConfigId();

        return {
          sessionId,
          configId,
          token,
        }

      }
    }
    onDeleted()
    {
      this.oAuth2Client.delete_device(this);
    }

    onOAuth2MigrateSuccess() {
      this.unsetStoreValue('token');
    }

    async _GetStateInfo() {
        this.log(`processing Data for PointDevice ${this.id}`);
        for (let action in actions) {
            this._GetDataForAction(action, actions[action]);
        }
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
                this.setCapabilityValue(capability, parseFloat(value.value));
            }
            else {
                this.log(`No Data found for ${action}`);
            }
        });
    }

    async _GetGeneralData()
    {
        let path = `devices/${this.id}`
        this.oAuth2Client.getDeviceData(path).then((data) => {
            this.setCapabilityValue('measure_battery', parseFloat(data.battery.percent))
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
            if (data.ongoing_events.includes('alarm_grace_period_expired'))
                this.setCapabilityValue('alarm_motion', true);
            else
                this.setCapabilityValue('alarm_motion', false);
        });
    }
  }
module.exports = point;
