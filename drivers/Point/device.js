const Homey = require('homey');
const utils = require('../../Lib/utils')
const OAuth2Device = require('homey-wifidriver').OAuth2Device;
//const { OAuth2Device } = require('homey-oauth2app');
const POLL_INTERVAL = 60 * 1000;

const actions = {
    temperature: "measure_temperature",
    humidity: "measure_humidity",
    pressure: "measure_pressure",
    sound_level: "measure_noise",
    part_als: "measure_luminance",
}

class point extends OAuth2Device {

    async onInit() {
        await super.onInit({
            apiBaseUrl: `https://api.minut.com/v1/`,
            throttle: 200,
            rateLimit: {
                max: 15,
                per: 60000,
            },
        }).catch(err => {
            this.error('Error onInit', err.stack);
            return err;
        });
        this.log('init PointDevice');
        let data = this.getData();
        this.id = data.id;
        //this.GetStatusInterval = setInterval(this._GetStateInfo.bind(this), 60 * 1000)
        this.registerPollInterval({
            id: 'GetStatusInfo',
            fn: this._GetStateInfo.bind(this),
            interval: POLL_INTERVAL, 
        })
        this.registerPollInterval({
            id: 'refreshTokens',
            fn: this.oauth2Account.refreshAccessTokens.bind(this.oauth2Account),
            interval: 60 * 60 * 1000, // 6 hours
        });
        try {
            await this.oauth2Account.refreshAccessTokens();
        } catch (err) {
            this.error('onInit() -> refresh access tokens failed', err);
        }
        await this.registerWebhookSubscription();
        await this.RegisterFlows();     
        this._GetStateInfo();

    }
    async _GetStateInfo() {
        this.log(`processing Data for PointDevice ${this.id}`);
        for (let action in actions) {
            this._GetDataForAction(action, actions[action]);
        }
        this._GetGeneralData();
    }

    async _GetDataForAction(action, capability) {
        let datum = new Date();
        datum.setHours(datum.getHours() - 1);
        let calldata = {
            uri: `devices/${this.id}/${action}?start_at=${datum.toISOString()}`
        }
        this.apiCallGet(calldata).then((data) => {
            if (Array.isArray(data.values) && data.values.length > 0) {
                var value = data.values[data.values.length - 1]
                let collectiontime = new Date(value.datetime);
                this.log(`Collecting ${action}  With Date ${collectiontime.toLocaleString()} And value ${value.value}`);
                this.setCapabilityValue(capability, parseFloat(value.value));
            }
            else {
                this.log(`No Data found for ${action}`);
            }
        });
    }

    /**
    * This method will be called when the device has been deleted, it makes
    * sure the client is properly destroyed and left over settings are removed.
    */
    onDeleted() {
        this.log('onDeleted()');
        super.onDeleted();
    }

    async _GetGeneralData()
    {
        let calldata = {
            uri: `devices/${this.id}`
        }
        this.apiCallGet(calldata).then((data) => {
            this.setCapabilityValue('measure_battery', parseFloat(data.battery.percent))
            if (data.ongoing_events.includes("avg_sound_high"))
                this.setCapabilityValue('alarm_Noise', true);
            else
                this.setCapabilityValue('alarm_Noise', false);
            if (data.ongoing_events.includes('temperature_high') || data.ongoing_events.includes('temperature_low'))
                this.setCapabilityValue('alarm_Temp', true);
            else
                this.setCapabilityValue('alarm_Temp', false);
            if (data.ongoing_events.includes('humidity_high') || data.ongoing_events.includes('humidity_low'))
                this.setCapabilityValue('alarm_Hum', true);
            else
                this.setCapabilityValue('alarm_Hum', false);
            if (data.ongoing_events.includes('alarm_grace_period_expired'))
                this.setCapabilityValue('alarm_motion', true);
            else
                this.setCapabilityValue('alarm_motion', false);
        });
    }
    registerWebhook(data) {
        const debouncedMessageHandler = debounce(this._webhookhandler.bind(this), 500, true);
        return new Homey.CloudWebhook(Homey.env.WEBHOOK_ID, Homey.env.WEBHOOK_SECRET, data)
            .on('message', debouncedMessageHandler)
            .register()
    }

    findDevice(device) {
        if (this.id == device)
            return this;
        else
            return undefined;
    }
    
    _webhookhandler(args) {
        this.log('_webhookhandler', new Date().getTime());
        //console.log(data)
        // Data needs to be unwrapped
        if (args && args.hasOwnProperty('body')) {
            
            //this.log(args.body);
            try {
                this.log('Got a webhook message!');
                //console.log(args)
                this.log(`ID: ${args.body.event.id}`);
                this.log(`Created At: ${args.body.event.created_at}`);
                this.log(`type: ${args.body.event.type}`);
                this.log(`Device: ${args.body.event.device_id}`)
                let device = this.findDevice(args.body.event.device_id);
                if (!device) {
                    this.log("device undefinded?");
                    return;
                }
                let eventtype = args.body.event.type;
                this.log(eventtype);
                //this.SetValue(device);
                let sensor_value = args.body.event.sensor_value;
                this._flowTriggerGenericAlarm.trigger(device, { "Alarm": eventtype }, {});
                switch (eventtype) {
                    case "alarm_heard":
                        this.log("Triggering alarm_heard");
                        this._flowTriggeralarm_heard.trigger(device, {}, {})
                        break;
                    case "short_button_press":
                        this.log("Triggering short_button_press");
                        this._flowTriggeralarm_Button.trigger(device, {}, {});
                        break;
                    case "alarm_grace_period_expired":
                        this.log(`Motion Seen alarm triggering`);
                        this._flowTriggeralarm_Motion.trigger(device, {}, {});
                        this.setCapabilityValue("alarm_motion", true);
                        break;
                    case "temperature_high":
                        this.log("Triggering temperature_high");
                        this._flowTriggerTempHigh.trigger(device, { "temperature": sensor_value }, {});
                        break;
                    case "temperature_low":
                        this.log("Triggering temperature_low");
                        this._flowTriggerTempLow.trigger(device, { "temperature": sensor_value }, {});
                        break;
                    case "temperature_dropped_normal":
                        this.log("Triggering temperature_dropped_normal");
                        this._flowTriggerTempnormal.trigger(device, { "temperature": sensor_value }, {});
                        break;
                    case "temperature_risen_normal":
                        this.log("Triggering temperature_risen_normal");
                        this._flowTriggerTempnormal.trigger(device, { "temperature": sensor_value }, {});
                        break;
                    case "humidity_high":
                        this.log("Triggering humidity_high");
                        this._flowTriggerHumHigh.trigger(device, { "Humidity": sensor_value }, {});
                        break;
                    case "humidity_low":
                        this.log("Triggering humidity_low");
                        this._flowTriggerHumHigh.trigger(device, { "Humidity": sensor_value }, {});
                        break;
                    case "humidity_dropped_normal":
                        this.log("Triggering humidity_dropped_normal");
                        this.this._flowTriggerHumNormal.trigger(device, { "Humidity": sensor_value }, {});
                        break;
                    case "humidity_risen_normal":
                        this.log("Triggering humidity_risen_normal");
                        this.this._flowTriggerHumNormal.trigger(device, { "Humidity": sensor_value }, {});
                        break;
                    case "avg_sound_high":
                        this.log("Triggering avg_sound_high");
                        this._flowTriggeralarm_Sound.trigger(device, { "Sound": sensor_value }, {});
                        break;
                    case "sound_level_dropped_normal":
                        this.log("Triggering sound_level_dropped_normal");
                        this._flowTriggeralarm_Soundnormal.trigger(device, { "Sound": sensor_value }, {});
                        break;
                    case "device_offline":
                        this.log("Triggering device_offline");
                        this._flowTriggeralarm_offline.trigger(device, {}, {});
                        break;
                    case "device_online":
                        this.log("Triggering device_online");
                        this._flowTriggeralarm_online.trigger(device, {}, {});
                        break;
                    case "tamper":
                        this.log("Triggering tamper");
                        this._flowTriggeralarm_Tamper.trigger(device, {}, {});
                        break;
                    case "battery_low":
                        this.log("Triggering battery_low");
                        break;
                    case "battery_empty":
                        this.log("Triggering battery_empty");
                        break;
                    default:
                        this._flowTriggerGenericAlarm.trigger(device, { "Alarm": eventtype }, {});
                        break;
                }
            }
            catch (err) {
                this.log(err)
            }

        }
    }

    RegisterFlows() {
        this._flowTriggerGenericAlarm = new Homey.FlowCardTriggerDevice('any_alarm').register();
        this._flowTriggeralarm_heard = new Homey.FlowCardTriggerDevice('alarm_heard').register();
        this._flowTriggeralarm_Button = new Homey.FlowCardTriggerDevice("short_button_press").register();
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
        this._flowTriggeralarm_Motion = new Homey.FlowCardTriggerDevice("alarm_grace_period_expired").register();
        this._flowTriggeralarm_Tamper = new Homey.FlowCardTriggerDevice("Tamper").register();
    }
    /**
	 * Method that will request a subscription for webhook events for the next hour.
	 * @returns {Promise<void>}
	 */
    async registerWebhookSubscription() {
        let webhookIsRegistered = false;

        this.log('registerWebhookSubscription()');

        // Refresh webhooks after 15 minutes of inactivity
        clearTimeout(this._registerWebhookSubscriptionTimeout);
        this._registerWebhookSubscriptionTimeout = setTimeout(() => this.registerWebhookSubscription(), 1000 * 60 * 15);

        // TODO: get current webhook
        try {
            const webhooks = await this.apiCallGet({ uri: `webhooks`, });
            //console.log(webhooks);
            // Detect if a webhook was already registered by Homey
            if (Array.isArray(webhooks.hooks)) {
                webhooks.hooks.forEach(webhook => {
                    if (webhook.url === Homey.env.WEBHOOK_URL) {
                        this.log(`found webhook ${webhook.hook_id}`);
                        webhookIsRegistered = true;
                        this.registerWebhook(webhook);
                    }
                })
                if (!webhookIsRegistered)
                    this.log(`No existing webhooks found`)
            }
        } catch (err) {
            this.error('failed to get existing subscriptions', err.message);
        }

        // Start new subscription if not yet registered
        if (!webhookIsRegistered) {
            try {
                var webhook = await this.apiCallPost({
                    uri: `webhooks`,
                    json: {
                        url: Homey.env.WEBHOOK_URL,
                        events: ["*"]
                        //events: ["alarm_heard",
                        //    "glassbreak",
                        //    "short_button_press",
                        //    "temperature_high",
                        //    "temperature_low",
                        //    "temperature_dropped_normal",
                        //    "temperature_risen_normal",
                        //    "humidity_high",
                        //    "humidity_low",
                        //    "humidity_dropped_normal",
                        //    "humidity_risen_normal",
                        //    "device_offline",
                        //    "device_online",
                        //    "tamper",
                        //    "battery_low",
                        //    "avg_sound_high",
                        //    "sound_level_high_quiet_hours",
                        //    "sound_level_high_despite_warning",
                        //    "sound_level_dropped_normal"]
                    }
                });
                this.log(`Created webhook ${webhook.hook_id}`);
                this.registerWebhook(webhook);
            } catch (err) {
                this.error('failed to register webhook subscription', err.message);

                // Pass error
                throw err;
            }
        }
    }
}
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
module.exports = point;