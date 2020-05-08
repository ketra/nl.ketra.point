'use strict';

const { OAuth2Client } = require('homey-oauth2app');
const Homey = require('homey');
const devices = [];
class PointOauthClient extends OAuth2Client {

  async getDeviceData(uri) {
      return this.get({
          path: uri
      });
  }
  async getDevices() {
      this.log("Getting Devices");
      return this.get({
          path: 'devices/'
      });
  }
  async getHomes() {
      return this.get({
          path: 'homes/'
      });
  }
  async register_device(device) {
    this.log(`Register ${device.id}`);
    Homey.app.mylog(`Register ${device.id}`);
    devices.push(device);
  }

  async delete_device(device) {
    this.log(`deRegister ${device.id}`);
    Homey.app.mylog(`deRegister ${device.id}`);
    devices.splice(devices.indexOf(device), 1);
  }

  get_device(device_id) {
    this.log(`Looking for dev ${device_id}`);
    Homey.app.mylog(`Looking for dev ${device_id}`);
    let dev = devices.find(x => x.id === device_id);
    this.log(`Found device ${dev.id}`);
    Homey.app.mylog(`Found device ${dev.id}`);
    return dev;
  }

  AttachWebhookListener(data) {
    this.log(`Attached listener to ${data.hook_id}`)
    Homey.app.mylog(`Attached listener to ${data.hook_id}`)
    const debouncedMessageHandler = debounce(this._webhookhandler.bind(this), 500, true);
      return new Homey.CloudWebhook(Homey.env.WEBHOOK_ID, Homey.env.WEBHOOK_SECRET, data)
          .on('message', debouncedMessageHandler)
          .register();
  }

  _webhookhandler(args) {
      let datetime = new Date().getTime();
    this.log('_webhookhandler', datetime);
    Homey.app.mylog('_webhookhandler', datetime);
    //console.log(data)
    // Data needs to be unwrapped
    if (args && args.hasOwnProperty('body')) {

      //this.log(args.body);
      try {
        this.log('Got a webhook message!');
        Homey.app.mylog('Got a webhook message!');
        console.log(args)
        this.log(`ID: ${args.body.event.id}`);
        this.log(`Created At: ${args.body.event.created_at}`);
        this.log(`type: ${args.body.event.type}`);
        this.log(`Device: ${args.body.event.device_id}`);
        Homey.app.mylog(`ID: ${args.body.event.id}`);
        Homey.app.mylog(`Created At: ${args.body.event.created_at}`);
        Homey.app.mylog(`type: ${args.body.event.type}`);
        Homey.app.mylog(`Device: ${args.body.event.device_id}`);
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
            this._flowTriggerHumHigh.trigger(device, {
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
    this._flowTriggeralarm_Alarm_Motion = new Homey.FlowCardTriggerDevice("alarm_grace_period_expired").register();
	this._flowTriggeralarm_Motion = new Homey.FlowCardTriggerDevice("alarm_grace_period_expired").register();
    this._flowTriggeralarm_Tamper = new Homey.FlowCardTriggerDevice("Tamper").register();
  }

  async postWebhook() {
    try {
      var webhook = await this.post({
        path: `webhooks`,
        json: {
          url: Homey.env.WEBHOOK_URL,
          events: ["*"]
        }
      });
      this.log(`Created webhook ${webhook.hook_id}`);
      Homey.app.mylog(`Created webhook ${webhook.hook_id}`);
      this.AttachWebhookListener(webhook);
    } catch (err) {
      this.error('failed to register webhook subscription', err.message);
      Homey.app.mylog('failed to register webhook subscription', err.message);
      // Pass error
      throw err;
    }
    }

  async GetWebhooks()
  {
      try {
        let webhooks = await this.getDeviceData(`webhooks`);
        //let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.WEBHOOK_URL);
        return webhooks.hooks;
      }
      catch (err) {
      this.error('failed to get existing subscriptions', err.message);
      Homey.app.mylog('failed to get existing subscriptions', err.message);
    }
  }

  async DeleteOldWebhooks()
  {
    try
    {
      let webhooks = await this.getDeviceData(`webhooks`);
      let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.OLD_WEBHOOK_URL);
      Homey.app.mylog(`deleting old webhooks.`);
      var self = this;
      mywebhooks.forEach(function(webhook) {
        Homey.app.mylog(`deleting ${webhook.hook_id}`);
        self.delete({
            path: `webhooks/${webhook.hook_id}`
        });
      });
      return this.GetWebhooks();
    }
    catch (err)
    {
      this.error(err);
      Homey.app.mylog(err);
    }
  }

  async RefreshWebhooks()
  {
    try
    {
      let webhooks = await this.getDeviceData(`webhooks`);
      let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.WEBHOOK_URL);
      Homey.app.mylog(`deleting all webhooks.`);
      var self = this;
      mywebhooks.forEach(function(webhook) {
        Homey.app.mylog(`deleting ${webhook.hook_id}`);
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
      Homey.app.mylog(err);
    }
  }


  /**
   * Method that will request a subscription for webhook events for the next hour.
   * @returns {Promise<void>}
   */
  async registerWebhookSubscription() {
    let webhookIsRegistered = false;

    this.log('registerWebhookSubscription()');
    Homey.app.mylog('registerWebhookSubscription()');

    // Refresh webhooks after 15 minutes of inactivity
    clearTimeout(this._registerWebhookSubscriptionTimeout);
    this._registerWebhookSubscriptionTimeout = setTimeout(() => this.registerWebhookSubscription(), 1000 * 60 * 15);

    // TODO: get current webhook
    try {
      let webhooks = await this.getDeviceData(`webhooks`);
      //console.log(webhooks);
      // Detect if a webhook was already registered by Homey

      if (Array.isArray(webhooks.hooks)) {
          let mywebhooks = webhooks.hooks.filter((webhook) => webhook.url === Homey.env.WEBHOOK_URL);
        if (mywebhooks.length > 1) {
            this.log(`Found multiple webhooks, deleting all.`);
            Homey.app.mylog(`Found multiple webhooks, deleting all.`);
            var self = this;
          mywebhooks.forEach(function(webhook) {
              self.delete({
                  path: `webhooks/${webhook.hook_id}`
              });
          });
          this.postWebhook();
        } else if (mywebhooks.length === 1) {
            this.log(`Found 1 webhook, start listening. to ${mywebhooks[0].hook_id}`);
            Homey.app.mylog(`Found 1 webhook, start listening. to ${mywebhooks[0].hook_id}`);
            this.AttachWebhookListener(mywebhooks[0]);
        } else {
            this.log(`No hooks found, registering new webhook`);
            Homey.app.mylog(`No hooks found, registering new webhook`);
            this.postWebhook();
        }
      }
    } catch (err) {
      this.error('failed to get existing subscriptions', err.message);
      Homey.app.mylog('failed to get existing subscriptions', err.message);
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
};

module.exports = PointOauthClient;
