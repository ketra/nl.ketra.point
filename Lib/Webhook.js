const Homey = require('homey'); 
const API = require('./Api')

let id = Homey.env.WEBHOOK_ID;
let secret = Homey.env.WEBHOOK_SECRET;
let devices = [];
let generictimeout;

class pointWebhook {

    AddDevice(device)
    {
        devices.push(device);
        console.log(devices)
    }
    RemoveDevice(device)
    {
        devices = devices.filter(function (item) {
            return item !== device
        })
        console.log(devices)
    }

    RegisterWebhook(data) {
        let myWebhook = new Homey.CloudWebhook(id, secret, data);
        myWebhook
            .on('message', args => {
                Homey.app.log('Got a webhook message!');
                //console.log(args)
                Homey.app.log('ID:' + args.body.event.id); 
                Homey.app.log('Created At: ' + args.body.event.created_at);
                Homey.app.log('type: ' + args.body.event.type);
                let device = this.findDevice(args.body.event.device_id)
                this.SetValue(device);
                switch (args.body.event.type) {
                    case "alarm_heard":
                        this._flowTriggeralarm_heard.trigger(device, {}, {})
                        break;
                    case "short_button_press":
                        this._flowTriggeralarm_Button.trigger(device, {}, {});
                        break;
                    default:
                        this._flowTriggerGenericAlarm.trigger(device, {}, {});
                        break;
                }
            })
            .register()
            .then(() => {
                this._flowTriggerGenericAlarm = new Homey.FlowCardTriggerDevice('Generic_alarm').register();
                this._flowTriggeralarm_heard = new Homey.FlowCardTriggerDevice('alarm_heard').register();
                this._flowTriggeralarm_Button = new Homey.FlowCardTriggerDevice("short_button_press").register()
                Homey.app.log('Webhook registered!');
            })
            .catch(this.error)
    }

    SetValue(device)
    {
        clearTimeout(generictimeout);
        device.setCapabilityValue("alarm_generic", true);
        generictimeout = setTimeout(() => { device.setCapabilityValue("alarm_generic", false) }, 30000);
    }

    findDevice(deviceid)
    {
       return devices.find(function (device) { return device.id === deviceid  });
    }

}
module.exports = pointWebhook