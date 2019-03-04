const Homey = require('homey');
//const axios = require('axios')
const PointAPI = require('../../Lib/Api')
const utils = require('../../Lib/utils')
const Hook = require('../../Lib/Webhook')
const POLL_INTERVAL = 60 * 1000;

class pointhome extends Homey.Device {

    onInit() {
        this._utils = new utils();
        
        this._API = new PointAPI();
        this._API.authenticate((error, result) => { });
        let data = this.getData();
        this._utils.logtoall("Init", "Home with ID: " + data.id);
        this.id = data.id;
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000);
        this._GetStateInfo();
        this._Set_listeners();
    }

    onDeleted()
    {

    }

    async _GetStateInfo() {
        try {
            this._API.GetHomeAlarm(this.id, (error, result) => {
                if (error)
                    console.log(error);
                this._utils.logtoall("Device", "The alarm has state " + result)
                this.setCapabilityValue('alarm_generic', result);
            });
        }
        catch (err) {
            this._utils.logtoall("Device", err)
            console.log(err)
        }
    }

    _Set_listeners() {
        let set_alarm_on = new Homey.FlowCardAction('set_alarm_on');
        set_alarm_on
            .register()
            .registerRunListener((args, state) => {
                this._API.SetAlarmStatus(this.id, "on", () => { return Promise.resolve() });
            });
        let set_alarm_off = new Homey.FlowCardAction('set_alarm_off');
        set_alarm_off
            .register()
            .registerRunListener((args, state) => {
                this._API.SetAlarmStatus(this.id, "off", () => { return Promise.resolve() });
            });
    }
}
module.exports = pointhome;