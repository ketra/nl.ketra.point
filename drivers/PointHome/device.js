const Homey = require('homey');
const utils = require('../../Lib/utils')
const OAuth2Device = require('homey-wifidriver').OAuth2Device;
//const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 60 * 1000;

class PointHome extends OAuth2Device {

    async onInit() {
        await super.onInit({
            apiBaseUrl: `https://api.minut.com/v1/`,
            throttle: 200,
            rateLimit: {
                max: 15,
                per: 60000,
            },
        }).catch(err => {
            this.error('Error onInit', err.stack);
            return err;
        });
        this.log('init PointHome');
        let data = this.getData();
        this.id = data.id;
        this.registerPollInterval({
            id: 'GetStatusInfo',
            fn: this._GetStateInfo.bind(this),
            interval: POLL_INTERVAL,
        })
        this.registerPollInterval({
            id: 'refreshTokens',
            fn: this.oauth2Account.refreshAccessTokens.bind(this.oauth2Account),
            interval: 60 * 60 * 1000, // 6 hours
        });
        this.registerCapabilityListener('locked', async (value) => {
            if (value)
            {
                this.log('Turning alarm on.');
                return this.apiCallPut({ uri: `homes/${this.id}/alarm` }, { alarm_status: "on" });
            }
            else
            {
                this.log('Turning alarm off.');
                return this.apiCallPut({ uri: `homes/${this.id}/alarm` }, { alarm_status: "off" });
            }
        });
        this._GetStateInfo();
        this._Set_listeners();
    }

    onDeleted()
    {

    }

    async _GetStateInfo() {
        this.log(`processing Data for Pointhome ${this.id}`);
        this.apiCallGet({ uri: `homes/${this.id}` }).then((data) => {
            this.log(`alarm has state ${data.alarm_status}`)
            if (data.alarm_status == "off")
                this.setCapabilityValue('locked', false);
            if (data.alarm_status == "on")
                this.setCapabilityValue('locked', true);
        });
    }

    _Set_listeners() {
        let set_alarm_on = new Homey.FlowCardAction('set_alarm_on');
        set_alarm_on
            .register()
            .registerRunListener((args, state) => {
                this.log('Turning alarm on.');
                return this.apiCallPut({ uri: `homes/${this.id}/alarm` }, { alarm_status: "on" });
            });
        let set_alarm_off = new Homey.FlowCardAction('set_alarm_off');
        set_alarm_off
            .register()
            .registerRunListener((args, state) => {
                this.log('Turning alarm off.');
                return this.apiCallPut({ uri: `homes/${this.id}/alarm` }, { alarm_status: "off" });
            });
    }
    _setState(status)
    {
        

    }
}
module.exports = PointHome;