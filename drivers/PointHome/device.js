const Homey = require('homey');
const utils = require('../../Lib/utils')
//const OAuth2Device = require('homey-wifidriver').OAuth2Device;
const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 60 * 1000;

class PointHome extends OAuth2Device {

   async onOAuth2Init() {
        this.log('init PointHome');
        let data = this.getData();
        this.id = data.id;
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000)
        this.registerCapabilityListener('locked', async (value) => {
            if (value)
            {
                this.log('Turning alarm on.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { alarm_status: "on" }});
            }
            else
            {
                this.log('Turning alarm off.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { alarm_status: "off" }});
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
        this.oAuth2Client.getDeviceData(`homes/${this.id}`).then((data) => {
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
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { alarm_status: "on" }});
            });
        let set_alarm_off = new Homey.FlowCardAction('set_alarm_off');
        set_alarm_off
            .register()
            .registerRunListener((args, state) => {
                this.log('Turning alarm off.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { alarm_status: "off" }});
            });
    }
    _setState(status)
    {


    }
}
module.exports = PointHome;
