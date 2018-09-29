const Homey = require('homey');
const axios = require('axios')
const PointAPI = require('../../Lib/Api')
const utils = require('../../Lib/utils')
const POLL_INTERVAL = 60 * 1000;

class point extends Homey.Device {

    onInit() {
        this._utils = new utils()
        this._API = new PointAPI()
        let data = this.getData();
        this._utils.logtoall("Init",data)
        this.id = data.id
        setInterval(this._GetStateInfo.bind(this),60 * 1000)
    }
    async _GetStateInfo() {
        let temperature = await this._API.GetValue(this.id, 'temperature')
        this.setCapabilityValue('measure_temperature', parseFloat(temperature))
        let Humidity = await this._API.GetValue(this.id, 'humidity')
        this.setCapabilityValue('measure_humidity', parseFloat(Humidity))
        let barometic = await this._API.GetValue(this.id, 'pressure')
        this.setCapabilityValue('measure_pressure', parseFloat(barometic))
        let sound = await this._API.GetValue(this.id, 'sound_level')
        this.setCapabilityValue('measure_noise', parseFloat(sound))
        //let lux = await this._API.GetValue(this.id,'part_als')
        //this.setCapabilityValue('measure_noise', parseFloat(sound))
    }
}
module.exports = point