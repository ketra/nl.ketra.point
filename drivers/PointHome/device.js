const Homey = require('homey');
const utils = require('../../Lib/utils');
const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 900 * 1000;

class PointHome extends OAuth2Device {

    async onOAuth2Init() {
        this.log('init PointHome');
        this.readyDevice();
    }

    readyDevice() {
        let data = this.getData();
        this.id = data.id;
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), POLL_INTERVAL);
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
        let set_alarm_on = this.homey.flow.getActionCard('set_alarm_on');
        set_alarm_on
            .registerRunListener((args, state) => {
                this.log('Turning alarm on.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { "alarm_status": "on", "alarm_mode": "manual" }});
            });
        let set_alarm_off = this.homey.flow.getActionCard('set_alarm_off');
        set_alarm_off
            .registerRunListener((args, state) => {
                this.log('Turning alarm off.');
                return this.oAuth2Client.put({ path: `homes/${this.id}/alarm`, json: { "alarm_status": "off", "alarm_mode": "manual" }});
            });
        let disturbance_monitoring_active = this.homey.flow.getActionCard("disturbance_monitoring_active");
        disturbance_monitoring_active
            .registerRunListener((args, state) => {
                this.log('Turning disturbance alarm on.');
                return this.oAuth2Client.put({ path: `homes/${this.id}`, json: { "disturbance_monitoring_active": true }});
            });
        let disturbance_monitoring_inactive = this.homey.flow.getActionCard("disturbance_monitoring_inactive");
        disturbance_monitoring_inactive
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
        if (this.homey.app.hasOAuth2Client({ configId, sessionId })) {
            client = this.homey.app.getOAuth2Client({ configId, sessionId });
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
