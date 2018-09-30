'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')
const PointAPI = require('../../Lib/Api')

class Point extends Homey.Driver  {

    onPair(socket) {
        let utils = new util()
        let API = new PointAPI()
        try {
            if (HomeyHomey.ManagerSettings.get('refresh_token') === undefined) {
                API.startOath(socket);
            }
            else {
                API.ListDevices(socket);
            }
               
            }
        catch (err) {
                utils.logtoall("Error On Pairing Device: " + err)
            }

    }

}
module.exports = Point;