'use strict';

const { OAuth2Client } = require('homey-oauth2app');
const Homey = require('homey');
const devices = [];
class PointOauthClient extends OAuth2Client {

  // Required:
  static OAUTH2_CLIENT = PointOauthClient; // Default: OAuth2Client
  static API_URL = 'https://api.minut.com/v5/';
  static TOKEN_URL = 'https://api.minut.com/v5/oauth/token';
  static AUTHORIZATION_URL = 'https://api.minut.com/v5/oauth/authorize';

  async getDeviceData(uri)
  {
      return this.get({
          path: uri
      });
  }

  async getDevices()
  {
      this.log("Getting Devices");
      return this.get({
          path: 'devices/',
          query: { "active": true },
      });
  }

  async getHomes()
  {
      return this.get({
          path: 'homes/'
      });
  }

  async register_device(device)
  {
    this.log(`Register ${device.id}`);
    this.homey.app.mylog(`Register ${device.id}`);
    devices.push(device);
  }

  async delete_device(device)
  {
    this.log(`deRegister ${device.id}`);
    this.homey.app.mylog(`deRegister ${device.id}`);
    devices.splice(devices.indexOf(device), 1);
  }

  get_device(device_id)
  {
    this.log(`Looking for dev ${device_id}`);
    this.homey.app.mylog(`Looking for dev ${device_id}`);
    let dev = devices.find(x => x.id === device_id);
    this.log(`Found device ${dev.id}`);
    this.homey.app.mylog(`Found device ${dev.id}`);
    return dev;
  }

  async AttachWebhookListener(data)
  {
    this.log(`Attached listener to ${data.hook_id}`)
    this.homey.app.mylog(`Attached listener to ${data.hook_id}`)
    const debouncedMessageHandler = debounce(this._webhookhandler.bind(this), 500, true)
    let myWebhook = await this.homey.cloud.createWebhook(Homey.env.WEBHOOK_ID, Homey.env.WEBHOOK_SECRET, data)
    myWebhook.on('message', debouncedMessageHandler)
    return myWebhook
  }

  _webhookhandler(args)
  {
      let datetime = new Date().getTime();
    this.log('_webhookhandler', datetime);
    this.homey.app.mylog('_webhookhandler', datetime);
    //console.log(data)
    // Data needs to be unwrapped
    if (args && args.hasOwnProperty('body')) {

      //this.log(args.body);
      try {
        this.log('Got a webhook message!');
        this.homey.app.mylog('Got a webhook message!');
        console.log(args)
        this.log(`ID: ${args.body.event.id}`);
        this.log(`Created At: ${args.body.event.created_at}`);
        this.log(`type: ${args.body.event.type}`);
        this.log(`Device: ${args.body.event.device_id}`);
        this.homey.app.mylog(`ID: ${args.body.event.id}`);
        this.homey.app.mylog(`Created At: ${args.body.event.created_at}`);
        this.homey.app.mylog(`type: ${args.body.event.type}`);
        this.homey.app.mylog(`Device: ${args.body.event.device_id}`);
        let device = this.get_device(args.body.event.device_id);
        if (!device) {
          this.log("device undefinded?");
          return;
        } else {
            this.log(`Device is ${device.id}`);
        }
        let eventtype = args.body.event.type;
        this.log(eventtype);
        //this.SetValue(device);
        let sensor_value = args.body.event.sensor_value;
        this._flowTriggerGenericAlarm.trigger(device, {
          "Alarm": eventtype
        }, {});
        switch (eventtype) {
          case "alarm_heard":
            this.log("Triggering alarm_heard");
                this._flowTriggeralarm_heard.trigger(device, {}, {});
            break;
          case "short_button_press":
            this.log(`Triggering short_button_press for ${device.id}`);
            this._flowTriggeralarm_Button.trigger(device, {}, {});
            break;
          case "alarm_grace_period_expired":
            this.log(`Motion Seen alarm triggering`);
            this._flowTriggeralarm_Alarm_Motion.trigger(device, {}, {});
            device.setCapabilityValue("alarm_motion", true);
            break;
		  case "pir_motion":
            this.log(`Motion Seen`);
            this._flowTriggeralarm_Motion.trigger(device, {}, {});
            device.setCapabilityValue("alarm_motion", true);
            break;
          case "temperature_high":
            this.log("Triggering temperature_high");
            this._flowTriggerTempHigh.trigger(device, {
              "temperature": sensor_value
            }, {});
            break;
          case "temperature_low":
            this.log("Triggering temperature_low");
            this._flowTriggerTempLow.trigger(device, {
              "temperature": sensor_value
            }, {});
            break;
          case "temperature_dropped_normal":
            this.log("Triggering temperature_dropped_normal");
            this._flowTriggerTempnormal.trigger(device, {
              "temperature": sensor_value
            }, {});
            break;
          case "temperature_risen_normal":
            this.log("Triggering temperature_risen_normal");
            this._flowTriggerTempnormal.trigger(device, {
              "temperature": sensor_value
            }, {});
            break;
          case "humidity_high":
            this.log("Triggering humidity_high");
            this._flowTriggerHumHigh.trigger(device, {
              "Humidity": sensor_value
            }, {});
            break;
          case "humidity_low":
            this.log("Triggering humidity_low");
            this._flowTriggerHumLow.trigger(device, {
              "Humidity": sensor_value
            }, {});
            break;
          case "humidity_dropped_normal":
            this.log("Triggering humidity_dropped_normal");
            this.this._flowTriggerHumNormal.trigger(device, {
              "Humidity": sensor_value
            }, {});
            break;
          case "humidity_risen_normal":
            this.log("Triggering humidity_risen_normal");
            this.this._flowTriggerHumNormal.trigger(device, {
              "Humidity": sensor_value
            }, {});
            break;
          case "avg_sound_high":
            this.log("Triggering avg_sound_high");
            this._flowTriggeralarm_Soundhigh.trigger(device, {
              "Sound": sensor_value
            }, {});
            break;
          case "sound_level_dropped_normal":
            this.log("Triggering sound_level_dropped_normal");
            this._flowTriggeralarm_Soundnormal.trigger(device, {
              "Sound": sensor_value
            }, {});
            break;
          case "device_offline":
            this.log("Triggering device_offline");
            this._flowTriggeralarm_offline.trigger(device, {}, {});
            break;
          case "device_online":
            this.log("Triggering device_online");
            this._flowTriggeralarm_online.trigger(device, {}, {});
            break;
          case "tamper_removed":
            this.log("Triggering tamper_removed");
            this._flowTriggeralarm_Tamper.trigger(device, {}, {});
            break;
          case "glassbreak":
            this.log("Triggering tamper_removed");
            this._flowTriggeralarm_glassbreak.trigger(device, {}, {});
            break;
          case "battery_low":
            this.log("Triggering battery_low");
            break;
          case "battery_empty":
            this.log("Triggering battery_empty");
            break;
          case "disturbance_first_notice":
            this.log("Tiggering Disturbance Notice");
            this._flowTriggerDisturbance(device, { "Notice": 1}, {});
            break;
          case "disturbance_second_notice":
            this.log("Tiggering Disturbance Notice");
            this._flowTriggerDisturbance(device, { "Notice": 2}, {});
            break;
          case "disturbance_third_notice":
            this.log("Tiggering Disturbance Notice");
            this._flowTriggerDisturbance(device, { "Notice": 3}, {});
            break;
          default:
            this._flowTriggerGenericAlarm.trigger(device, {
              "Alarm": eventtype
            }, {});
            break;
        }
      } catch (err) {
          console.log(err);
      }

    }
  }

  RegisterFlows()
  {
    this._flowTriggerGenericAlarm = this.homey.flow.getDeviceTriggerCard('any_alarm');
    this._flowTriggeralarm_heard = this.homey.flow.getDeviceTriggerCard('alarm_heard');
    this._flowTriggeralarm_Button = this.homey.flow.getDeviceTriggerCard("short_button_press");
    this._flowTriggerTempHigh = this.homey.flow.getDeviceTriggerCard('temperature_high');
    this._flowTriggerTempLow = this.homey.flow.getDeviceTriggerCard('temperature_low');
    this._flowTriggerTempnormal = this.homey.flow.getDeviceTriggerCard('temperature_normal');
    this._flowTriggerHumLow = this.homey.flow.getDeviceTriggerCard('humidity_low');
    this._flowTriggerHumHigh = this.homey.flow.getDeviceTriggerCard('humidity_high');
    this._flowTriggerHumNormal = this.homey.flow.getDeviceTriggerCard("humidity_normal");
    this._flowTriggeralarm_offline = this.homey.flow.getDeviceTriggerCard("device_offline");
    this._flowTriggeralarm_online = this.homey.flow.getDeviceTriggerCard("device_online");
    this._flowTriggeralarm_Soundhigh = this.homey.flow.getDeviceTriggerCard("avg_sound_high");
    this._flowTriggeralarm_Soundnormal = this.homey.flow.getDeviceTriggerCard("avg_sound_normal");
    this._flowTriggeralarm_Alarm_Motion = this.homey.flow.getDeviceTriggerCard("alarm_grace_period_expired");
	this._flowTriggeralarm_Motion = this.homey.flow.getDeviceTriggerCard("alarm_grace_period_expired");
    this._flowTriggeralarm_Tamper = this.homey.flow.getDeviceTriggerCard("Tamper");
    this._flowTriggerDisturbance = this.homey.flow.getDeviceTriggerCard("disturbance_notice");
    this._flowTriggeralarm_glassbreak = this.homey.flow.getDeviceTriggerCard("glassbreak");
  }

  async postWebhook()
  {
    try {
      var webhook = await this.post({
        path: `webhooks`,
        json: {
          url: Homey.env.WEBHOOK_URL,
          events: ["*"]
        }
      });
      this.log(`Created webhook ${webhook.hook_id}`);
      this.homey.app.mylog(`Created webhook ${webhook.hook_id}`);
      this.AttachWebhookListener(webhook);
    } catch (err) {
      this.error('failed to register webhook subscription', err.message);
      this.homey.app.mylog('failed to register webhook subscription', err.message);
      // Pass error
      throw err;
    }
    }

  async GetWebhooks()
  {
      try {
        let webhooks = await this.getDeviceData(`webhooks`);
        //let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === this.homey.env.WEBHOOK_URL);
        return webhooks.hooks;
      }
      catch (err) {
      this.error('failed to get existing subscriptions', err.message);
      this.homey.app.mylog('failed to get existing subscriptions', err.message);
    }
  }

  async DeleteOldWebhooks()
  {
    try
    {
      let webhooks = await this.getDeviceData(`webhooks`);
      let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.OLD_WEBHOOK_URL);
      this.homey.app.mylog(`deleting old webhooks.`);
      var self = this;
      mywebhooks.forEach(function(webhook) {
        this.homey.app.mylog(`deleting ${webhook.hook_id}`);
        self.delete({
            path: `webhooks/${webhook.hook_id}`
        });
      });
      return this.GetWebhooks();
    }
    catch (err)
    {
      this.error(err);
      this.homey.app.mylog(err);
    }
  }

  async RefreshWebhooks()
  {
    try
    {
      let webhooks = await this.getDeviceData(`webhooks`);
      let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url.startsWith(Homey.env.WEBHOOK_URL));
      this.homey.app.mylog(`deleting all webhooks.`);
      var self = this;
      mywebhooks.forEach(function(webhook) {
        self.homey.app.log(`deleting ${webhook.hook_id}`);
        self.delete({
            path: `webhooks/${webhook.hook_id}`
        });
      });
      this.postWebhook();
      return this.GetWebhooks();
    }
    catch (err)
    {
      this.error(err);
      this.homey.app.mylog(err);
    }
  }

  /**
   * Method that will request a subscription for webhook events for the next hour.
   * @returns {Promise<void>}
   */
  async registerWebhookSubscription()
  {
    let webhookIsRegistered = false;

    this.log('registerWebhookSubscription()');
    this.homey.app.mylog('registerWebhookSubscription()');

    // Refresh webhooks after 15 minutes of inactivity
    clearTimeout(this._registerWebhookSubscriptionTimeout);
    this._registerWebhookSubscriptionTimeout = setTimeout(() => this.registerWebhookSubscription(), 1000 * 60 * 60);

    // TODO: get current webhook
    try {
      let webhooks = await this.getDeviceData(`webhooks`);
      console.log(webhooks);
      // Detect if a webhook was already registered by Homey

      if (Array.isArray(webhooks.hooks)) {
          let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.WEBHOOK_URL);
        if (mywebhooks.length > 1) {
            this.log(`Found multiple webhooks, deleting all.`);
            this.homey.app.mylog(`Found multiple webhooks, deleting all.`);
            var self = this;
          mywebhooks.forEach(function(webhook) {
              self.delete({
                  path: `webhooks/${webhook.hook_id}`
              });
          });
          this.postWebhook();
        } else if (mywebhooks.length === 1) {
            this.log(`Found 1 webhook, start listening. to ${mywebhooks[0].hook_id}`);
            this.homey.app.mylog(`Found 1 webhook, start listening. to ${mywebhooks[0].hook_id}`);
            this.AttachWebhookListener(mywebhooks[0]);
        } else {
            this.log(`No hooks found, registering new webhook`);
            this.homey.app.mylog(`No hooks found, registering new webhook`);
            this.postWebhook();
        }
      }
    } catch (err) {
      this.error('failed to get existing subscriptions', err.message);
      this.homey.app.mylog('failed to get existing subscriptions', err.message);
    }
  }
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

module.exports = PointOauthClient;
