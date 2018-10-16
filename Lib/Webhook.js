const Homey = require('homey'); 
const API = require('./Api')

let id = Homey.env.WEBHOOK_ID;
let secret = Homey.env.WEBHOOK_SECRET;
let devices = [];
let generictimeout;

class pointWebhook {

    //Function to add device to array to keep track of webhooks for device.
    AddDevice(device)
    {
        devices.push(device);
       // console.log(devices)
    }

    //Function to remove device from array to no longer trigger webhook for device.
    RemoveDevice(device)
    {
        devices = devices.filter(function (item) {
            return item !== device
        })
        console.log(devices)
    }
    //Register the webhook.
    RegisterWebhook(data) {
        let myWebhook = new Homey.CloudWebhook(id, secret, data);
        myWebhook
            .on('message', args => {
                try {
                    Homey.app.log('Got a webhook message!');
                    //console.log(args)
                    Homey.app.log('ID:' + args.body.event.id);
                    Homey.app.log('Created At: ' + args.body.event.created_at);
                    Homey.app.log('type: ' + args.body.event.type);
                    let device = this.findDevice(args.body.event.device_id)
                    if (!device) {
                        Homey.app.log("device undefinded?")
                        return;
                    }
                    let eventtype = args.body.event.type;
                    Homey.app.log(eventtype)
                    //this.SetValue(device);
                    this._flowTriggerGenericAlarm.trigger(device, { "Alarm": eventtype }, {});
                    switch (eventtype) {
                        case "alarm_heard":
                            Homey.app.log("Triggering alarm_heard");
                            this._flowTriggeralarm_heard.trigger(device, {}, {})
                            break;
                        case "short_button_press":
                            Homey.app.log("Triggering short_button_press");
                            this._flowTriggeralarm_Button.trigger(device, {}, {});
                            break;
                        case "temperature_high":
                            Homey.app.log("Triggering temperature_high");
                            this._flowTriggerTempHigh.trigger(device, { "temperature": sensor_value }, {});
                            break;
                        case "temperature_low":
                            Homey.app.log("Triggering temperature_low");
                            this._flowTriggerTempLow.trigger(device, { "temperature": sensor_value }, {});
                            break;
                        case "temperature_dropped_normal":
                            Homey.app.log("Triggering temperature_dropped_normal");
                            this._flowTriggerTempnormal.trigger(device, { "temperature": sensor_value }, {});
                            break;
                        case "temperature_risen_normal":
                            Homey.app.log("Triggering temperature_risen_normal");
                            this._flowTriggerTempnormal.trigger(device, { "temperature": sensor_value }, {});
                            break;
                        case "humidity_high":
                            Homey.app.log("Triggering humidity_high");
                            this._flowTriggerHumHigh.trigger(device, { "Humidity": sensor_value }, {});
                            break;
                        case "humidity_low":
                            Homey.app.log("Triggering humidity_low");
                            this._flowTriggerHumHigh.trigger(device, { "Humidity": sensor_value }, {});
                            break;
                        case "humidity_dropped_normal":
                            Homey.app.log("Triggering humidity_dropped_normal");
                            this.this._flowTriggerHumNormal.trigger(device, { "Humidity": sensor_value }, {});
                            break;
                        case "humidity_risen_normal":
                            Homey.app.log("Triggering humidity_risen_normal");
                            this.this._flowTriggerHumNormal.trigger(device, { "Humidity": sensor_value }, {});
                            break;
                        case "avg_sound_high":
                            Homey.app.log("Triggering avg_sound_high");
                            this._flowTriggeralarm_Sound.trigger(device, { "Sound": sensor_value }, {});
                            break;
                        case "sound_level_dropped_normal":
                            Homey.app.log("Triggering sound_level_dropped_normal");
                            this._flowTriggeralarm_Soundnormal.trigger(device, { "Sound": sensor_value }, {});
                            break;
                        case "device_offline":
                            Homey.app.log("Triggering device_offline");
                            this._flowTriggeralarm_offline.trigger(device, {}, {});
                            break;
                        case "device_online":
                            Homey.app.log("Triggering device_online");
                            this._flowTriggeralarm_online.trigger(device, {}, {});
                            break;
                        case "tamper":
                            Homey.app.log("Triggering tamper");
                            this._flowTriggeralarm_Tamper.trigger(device, {}, {});
                            break;
                        case "battery_low":
                            Homey.app.log("Triggering battery_low");
                            break;
                        case "battery_empty":
                            Homey.app.log("Triggering battery_empty");
                            break;
                        default:
                            this._flowTriggerGenericAlarm.trigger(device, { "Alarm": eventtype }, {});
                            break;
                    }
                }
                catch (err)
                {
                    Homey.app.log(err)
                }
            })
            .register()
            .then(() => {
                //register all flows to be allowed to trigger.
                this._flowTriggerGenericAlarm = new Homey.FlowCardTriggerDevice('any_alarm').register();
                this._flowTriggeralarm_heard = new Homey.FlowCardTriggerDevice('alarm_heard').register();
                this._flowTriggeralarm_Button = new Homey.FlowCardTriggerDevice("short_button_press").register()
                this._flowTriggerTempHigh = new Homey.FlowCardTriggerDevice('temperature_high').register();
                this._flowTriggerTempLow = new Homey.FlowCardTriggerDevice('temperature_low').register();
                this._flowTriggerTempnormal = new Homey.FlowCardTriggerDevice('temperature_normal').register();
                this._flowTriggerHumLow = new Homey.FlowCardTriggerDevice('humidity_low').register();
                this._flowTriggerHumHigh = new Homey.FlowCardTriggerDevice('humidity_high').register();
                this._flowTriggerHumNormal = new Homey.FlowCardTriggerDevice("humidity_normal").register();
                this._flowTriggeralarm_offline = new Homey.FlowCardTriggerDevice("device_offline").register();
                this._flowTriggeralarm_online = new Homey.FlowCardTriggerDevice("device_online").register();
                this._flowTriggeralarm_Soundhigh = new Homey.FlowCardTriggerDevice("avg_sound_high").register();
                this._flowTriggeralarm_Soundnormal = new Homey.FlowCardTriggerDevice("avg_sound_normal").register();
                this._flowTriggeralarm_Tamper = new Homey.FlowCardTriggerDevice("Tamper").register();
                Homey.app.log('Webhook registered!');
                return this.myWebhook;
            })
            .catch(function (error) {
                Homey.app.log(error);
            });

    }
    //Obsolete function.
    SetValue(device)
    {
        clearTimeout(generictimeout);
        device.setCapabilityValue("alarm_generic", true);
        generictimeout = setTimeout(() => { device.setCapabilityValue("alarm_generic", false) }, 30000);
    }
    //find device in array.
    findDevice(deviceid)
    {
       return devices.find(function (device) { return device.id === deviceid  });
    }

}
module.exports = pointWebhook