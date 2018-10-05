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
                API.startOath(socket);
            }
            catch (err) {
                this.utils.logtoall(err)
                return callback(new Error('invalid_token'));
            }

    }
    onInit() {
        let API = new PointAPI()
        let pointhook = new Hook();
        if (!Homey.ManagerSettings.get('hook_id'))
            API.SetWebhook((error, result) => {
                
                if (error) {
                    console.log(error)
                }
                else {

                    Homey.app.log("Registered Webhook with id " + result.hook_id)
                    if (result.hook_id) {
                        Homey.ManagerSettings.set('hook_id', result.hook_id)
                        pointhook.RegisterWebhook(result.hook_id)
                    }
                }
            })
        else
        {
            Homey.app.log("Hookid found: " +  Homey.ManagerSettings.get('hook_id'));
            pointhook.RegisterWebhook(Homey.ManagerSettings.get('hook_id'))

        }
    }

}
module.exports = Point;