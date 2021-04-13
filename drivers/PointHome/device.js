const Homey = require('homey');
const utils = require('../../Lib/utils');
const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 60 * 1000;

class PointHome extends OAuth2Device {

    async onOAuth2Init() {
        this.log('init PointHome');
        this.readyDevice();
    }

    readyDevice() {
        let data = this.getData();
        this.id = data.id;
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000);
        this.registerCapabilityListener('locked', async (value) => {
			var alarmpath = `homes/${this.id}/alarm/`
            if (value) {
                this.log('Turning alarm on.');
                return this.oAuth2Client.put({ path: alarmpath, json: { "alarm_status": "on", "alarm_mode": "manual" } });
            }
            else {
                this.log('Turning alarm off.');
                return this.oAuth2Client.put({ path: alarmpath, json: { "alarm_status": "off", "alarm_mode": "manual" } });
            }
        });
        this._GetStateInfo();
        this._Set_listeners();
    }

    unreadyDevice() {
        this.log('Cleared Timeout');
        clearTimeout(this.GetStatusInterval);
    }

    onDeleted()
    {

    }

    async _GetStateInfo() {
        this.log(`processing Data for Pointhome ${this.id}`);
        this.oAuth2Client.getDeviceData(`homes/${this.id}`).then((data) => {
            this.log(data.disturbance_monitoring_active);
            this.log(`alarm has state ${data.alarm_status}`)
            if (data.alarm_status === "off")
                this.setCapabilityValue('locked', false);
            if (data.alarm_status === "on")
                this.setCapabilityValue('locked', true);
        });
    }

    _Set_listeners() {
        let set_alarm_on = new Homey.FlowCardAction('set_alarm_on');
        set_alarm_on
            .register()
            .registerRunListener((args, state) => {
                this.log('Turning alarm on.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { "alarm_status": "on", "alarm_mode": "manual" }});
            });
        let set_alarm_off = new Homey.FlowCardAction('set_alarm_off');
        set_alarm_off
            .register()
            .registerRunListener((args, state) => {
                this.log('Turning alarm off.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { "alarm_status": "off", "alarm_mode": "manual" }});
            });
        let disturbance_monitoring_active = new Homey.FlowCardAction("disturbance_monitoring_active");
        disturbance_monitoring_active.register()
            .registerRunListener((args, state) => {
                this.log('Turning disturbance alarm on.');
                return this.oAuth2Client.put({ path: `homes/${this.id}`, json: { "disturbance_monitoring_active": true }});
            });
        let disturbance_monitoring_inactive = new Homey.FlowCardAction("disturbance_monitoring_inactive");
        disturbance_monitoring_inactive.register()
            .registerRunListener((args, state) => {
                this.log('Turning disturbance alarm off.');
                return this.oAuth2Client.put({ path: `homes/${this.id}`, json: { "disturbance_monitoring_active": false }});
            });
    }
    _setState(status)
    {


    }
    async resetOAuth2Client({ sessionId, configId }) {

        // Store updated client config
        await this.setStoreValue('OAuth2SessionId', sessionId);
        await this.setStoreValue('OAuth2ConfigId', configId);

        // Check if client exists then bind it to this instance
        let client;
        if (Homey.app.hasOAuth2Client({ configId, sessionId })) {
            client = Homey.app.getOAuth2Client({ configId, sessionId });
        } else {
            this.error('OAuth2Client reset failed');
            return this.setUnavailable(Homey.__('authentication.re-login_failed'));
        }

        // Rebind new oAuth2Client
        this.oAuth2Client = client;

        // Check if device agreementId is present in OAuth2 account
        return this.setAvailable(this.readyDevice());
    }
}
module.exports = PointHome;
