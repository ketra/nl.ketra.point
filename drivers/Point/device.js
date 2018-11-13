const Homey = require('homey');
//const axios = require('axios')
const PointAPI = require('../../Lib/Api')
const utils = require('../../Lib/utils')
const Hook = require('../../Lib/Webhook')
const POLL_INTERVAL = 60 * 1000;

class point extends Homey.Device {

    onInit() {
        if (!Homey.app.webhook)
            Homey.app.CreateWebhook();
        this._utils = new utils();
        this.pointhook = new Hook();
        
        this._API = new PointAPI()
        this._API.authenticate((error, result) => { });
        let data = this.getData();
        this._utils.logtoall("Init",data)
        this.id = data.id
        this.pointhook.AddDevice(this)
        this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000)
        this._GetStateInfo();
    }
    onDeleted()
    {
        clearInterval(this.GetStatusInterval);
        this.pointhook.RemoveDevice(this);
    }
    async _GetStateInfo() {
        this._API.GetValue(this.id, 'temperature', (error, result) => {
            if (error)
                console.log(error)
            this.setCapabilityValue('measure_temperature', parseFloat(result));
        });
        this._API.GetValue(this.id, 'humidity', (error, result) => {
            if (error)
                console.log(error)
            this.setCapabilityValue('measure_humidity', parseFloat(result));
        });
        this._API.GetValue(this.id, 'pressure', (error, result) => {
            if (error)
                console.log(error)
            this.setCapabilityValue('measure_pressure', parseFloat(result));
        });
        this._API.GetValue(this.id, 'sound_level', (error, result) => {
            if (error)
                console.log(error)
            this.setCapabilityValue('measure_noise', parseFloat(result));
        });
        this._API.GetBattery(this.id, (error, result) => {
            if (error)
                console.log(error)
            this.setCapabilityValue('measure_battery', parseFloat(result.battery));
            if (result.Events.includes("avg_sound_high"))
                this.setCapabilityValue('LoudNoise', true)
            else
                this.setCapabilityValue('LoudNoise', false)
            if (result.Events.includes('temperature_high') || result.Events.includes('temperature_low'))
                this.setCapabilityValue('TempAlarm', true)
            else
                this.setCapabilityValue('TempAlarm', false)
            if (result.Events.includes('humidity_high') || result.Events.includes('humidity_low'))
                this.setCapabilityValue('HumAlarm', true)
            else
                this.setCapabilityValue('HumAlarm', false)
        });
        //this._API.GetValue(this.id, 'part_als', (error, result) => {
        //    if (error)
        //        console.log(error)
        //    this.setCapabilityValue('measure_luminance', parseFloat(result));
        //});
    }
}
module.exports = point