const Homey = require('homey');
const axios = require('axios')
const PointAPI = require('../../Lib/Api')
const utils = require('../../Lib/utils')
const POLL_INTERVAL = 60 * 1000;

class point extends Homey.Device {

    onInit() {
        this._utils = new utils()
        this._API = new PointAPI()
        this._API.authenticate();
        let data = this.getData();
        this._utils.logtoall("Init",data)
        this.id = data.id
        setInterval(this._GetStateInfo.bind(this),60 * 1000)
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
    }
}
module.exports = point