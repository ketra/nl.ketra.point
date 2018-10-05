const Homey = require('homey');

let id = Homey.env.WEBHOOK_ID;
let secret = Homey.env.WEBHOOK_SECRET;

class pointWebhook {

    RegisterWebhook(data) {
        let myWebhook = new Homey.CloudWebhook(id, secret, data);
        myWebhook
            .on('message', args => {
                Homey.app.log('Got a webhook message!');
                //console.log(args)
                Homey.app.log('ID:' + args.body.event.id); 
                Homey.app.log('Created At: ' + args.body.event.created_at);
                Homey.app.log('type: ' + args.body.event.type);
                if (args.body.event.type === "alarm_heard")
                {
                    this.TriggerGenericAlarm();
                }
                else
                {
                    this.Triggeralarm_heard();
                }
            })
            .register()
            .then(() => {
                this._flowTriggerGenericAlarm = new Homey.FlowCardTriggerDevice('Generic_alarm').register();
                this._flowTriggeralarm_heard = new Homey.FlowCardTriggerDevice('alarm_heard').register();
                Homey.app.log('Webhook registered!');
            })
            .catch(this.error)
    }
    TriggerGenericAlarm()
    {
        //this._flowTriggerGenericAlarm.trigger();
    }
    Triggeralarm_heard()
    {
        //this._flowTriggeralarm_heard.trigger()
    }
}
module.exports = pointWebhook