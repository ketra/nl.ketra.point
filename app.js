'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point"
const util = require('./Lib/utils.js')
const PointAPI = require('../../Lib/Api')
const Hook = require('../../Lib/Webhook')

class PointApp extends Homey.App {

    onInit() {
        this.utils = new util();
		this.log('PointApp is running...');
        this.log("Main", "App Started")
    }

    log(Text) {
        this.utils.logtoall("",Text)
    }

    CreateWebhook()
    {
        try {
            let API = new PointAPI()
            let pointhook = new Hook();
            if (!Homey.ManagerSettings.get('hook_id')) {
                API.SetWebhook((error, result) => {

                    if (error) {
                        console.log(error)
                    }
                    else {

                        this.log("listening on Webhook with id " + result.hook_id)
                        if (result.hook_id) {
                            Homey.ManagerSettings.set('hook_id', result.hook_id)
                            this.webhook = pointhook.RegisterWebhook(result.hook_id)

                        }
                    }
                })
            }
            else {
                this.log("Hookid found: " + Homey.ManagerSettings.get('hook_id'));
                this.webhook = pointhook.RegisterWebhook(Homey.ManagerSettings.get('hook_id'))
            }
        }
        catch(err){
            this.log(err)
        }
    }
}

module.exports = PointApp;