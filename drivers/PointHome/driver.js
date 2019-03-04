'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')
const PointAPI = require('../../Lib/Api')
const Hook = require('../../Lib/Webhook')

class Point extends Homey.Driver  {

    onPair(socket) {
        this.utils = new util()
        let API = new PointAPI()
            try {
                API.startOath(socket, (err, result) => {
                    socket.on('list_devices', (data, callback) => {
                        this.utils.logtoall("Oauth process", "Setup ListDevices");
                        API.GetHomes(callback);
                    });
                });
            }
            catch (err) {
                this.utils.logtoall(err)
                return callback(new Error('invalid_token'));
            }

    }
    onInit() {

    }

}
module.exports = Point;