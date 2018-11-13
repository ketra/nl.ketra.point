'use strict';

const Homey = require('homey');
const axios = require('axios');
const util = require('../../Lib/utils')

class API {

    constructor() {

        this._clientId = Homey.env.CLIENT_ID;
        this._clientSecret = Homey.env.CLIENT_SECRET;
        this._oAuth2AuthorizationUrl = `https://api.minut.com/v1/oauth/authorize`;
        this._oAuth2TokenUrl = `https://api.minut.com/v1/oauth/token`
        this._apiUrl = `https://api.minut.com/v1/`;
        this._redirectUri = 'https://callback.athom.com/oauth2/callback';
        this._token = null;
        axios.defaults.baseURL = 'https://api.minut.com/v1/';
        this.utils = new util();
        this._authenticated = false;
        this.OauthTimer;
    }

    async authenticate(callback) {
        try {
            clearInterval(this.OauthTimer);
            this.OauthTimer = setInterval(this.RefreshOath.bind(this), 1700 * 1000)
            axios.defaults.headers.common['Authorization'] = "Bearer " + Homey.ManagerSettings.get('access_token')
            this.RefreshOath((error, result) => { });
            callback();
        }
        catch (err) {

            console.log(err)
        }
    }
    async VerifyAuth(socket, callback)
    {
        try {
            if (Homey.ManagerSettings.get('access_token') === undefined)
                callback(new Error("No acces_token found"), null);
            else {
                this.RefreshOath((err, result) => {
                    if (err) {
                        console.log("line 45 " + err)
                        callback(err, null);
                    }
                    else {
                        socket.emit('authorized');
                        callback(null, true);
                    }
                })
            }
        }
        catch (err)
        {
            callback(err, null);
        }
    }

    async startOath(socket) {
        this.VerifyAuth(socket, (err, result) => {
            if (err) {
                let authrul = this._oAuth2AuthorizationUrl + '?client_id=' + this._clientId + '&response_type=code&redirect_uri=' + this._redirectUri
                console.log("Started Pairing. on url " + authrul)
                //Homey.App.log("Pair", "Started Pairing. on url " + authrul)
                let myOAuth2Callback = new Homey.CloudOAuth2Callback(authrul)
                myOAuth2Callback
                    .on('url', url => {
                        // dend the URL to the front-end to open a popup
                        socket.emit('url', url);
                    })
                    .on('code', code => {
                        this.utils.logtoall("code","Received Code " + code)
                        this.authorize(code, (err, result) => {
                            if (err) {
                                console.log(err)
                                this.utils.logtoall("Pair", "Error Received on Pair: " + err)
                                socket.emit('error', err);
                            }
                            else {
                                this.utils.logtoall("Startauth", "Authenticated succesfully")
                                socket.emit('authorized');
                            }
                        })
                    })
                    .generate()
                    .catch(err => {
                        console.log(err)
                        this.utils.logtoall("Pair", "Error Received on Pair: " + err)
                        socket.emit('error', err);
                    })
                socket.on('list_devices', (data, callback) => {
                    this.utils.logtoall("Oauth process", "Setup ListDevices")
                    this.GetDevices(callback);
                })
            }
            else {
                socket.on('list_devices', (data, callback) => {
                    this.utils.logtoall("Oauth process", "Setup ListDevices")
                    this.GetDevices(callback);
                })
            }
        })


    }
    async _Get(url, callback) {
        this.utils.logtoall("_GET", "Getting details from " + url)
        axios.get(url).then(function (result) {
            callback(null,result)
        }).catch(function (err) {
            //Homey.app.log(err)
            if (err.response.status === 401)
            {
                callback(401, null)
            }
            callback(err,null)
        })
    }

    async _GetOptions(options, callback)
    {
        axios(options).then(function (result) {
            callback(null,result)
        }).catch(function (err) {
            Homey.app.log(err)
            if (err.response.status === 401) {
                callback(401, null)
            }
            callback(err, null);
        })
    }

    async _Post(url, data, callback)
    {
        this.utils.logtoall("_POST", "Posting Data" + data)
        //console.log(data)
        axios.post(url, data, {
            baseURL: 'https://api.minut.com/draft1/'
        }).then(function (response) {
            callback(null,response.data)
        }).catch(function (err) {
            console.log(err)
            if (err.response.status === 401) {
                callback(401, null)
            }
            callback(err,null)
        });
    }

    async SetWebhook(callback)
    {
        this.CheckWebhook((error, result) => {
            if (result) {
                Homey.app.log("Already found webhook with id " + result.id);
                callback(null, result);
                return;
            }
            let data = {
                "url": Homey.env.WEBHOOK_URL,
                "events": ["alarm_heard",
                    "glassbreak",
                    "short_button_press",
                    "temperature_high",
                    "temperature_low",
                    "temperature_dropped_normal",
                    "temperature_risen_normal",
                    "humidity_high",
                    "humidity_low",
                    "humidity_dropped_normal",
                    "humidity_risen_normal",
                    "device_offline",
                    "device_online",
                    "tamper",
                    "battery_low",
                    "avg_sound_high",
                    "sound_level_high_quiet_hours",
                    "sound_level_high_despite_warning",
                    "sound_level_dropped_normal"]
            }
            this.authenticate((error, result) => {
                if (!error) {
                    this._Post('/webhooks', data, (error, result) => {
                        if (error) {
                            if (error === 401) {
                                this.authenticate((error, result) => {
                                    callback(null, this.SetWebhook(callback))
                                    return
                                })
                            }
                            else
                                callback(error, null)
                        }
                        else {
                            Homey.app.log("Registered webhook with id " + result.hook_id)
                            callback(null, result);
                        }
                    })
                }
            });
        });
    }

    CheckWebhook(callback) {
        this.GetWekhook((err, result) => {
            var found;
            if (result) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i].url == Homey.env.WEBHOOK_URL) {
                        found = result[i];
                        break;
                    }
                }
                if (found)
                    callback(null, found);
                else
                    callback(new Error("No Hooks found"),null)
            }
            else
            {
                callback(err,null );
            }
        })
    }

    async GetWekhook(callback) {
        this.utils.logtoall("Webhook", "Collecting Webhooks")
        let url = '/webhooks'
        let options = {
            baseURL: 'https://api.minut.com/draft1/',
            method: 'GET',
            url
        }
        this._GetOptions(options, (err, result) => {
            if (err) {
                //Homey.app.log(err)
                if (typeof callback === "function")
                    callback(err)
            }
            callback(null, result.data.hooks);
        });
    }

    async RefreshOath(callback) {
        this.utils.logtoall("Refresh Auth", "Refresing Oath Token.")
        let url = '/oauth/token'
        let options = {
            method: 'GET',
            data: {
                redirect_uri: this._redirectUri,
                client_id: this._clientId,
                client_secret: this._clientSecret,
                refresh_token: Homey.ManagerSettings.get('refresh_token'),
                grant_type: "refresh_token"
            }, url
        }
        this._GetOptions(options, (err, result) => {
            if (err) {
                //Homey.App.log(err)
                if (typeof callback === "function")
                    callback(err, null)
                return;
            }
            this.utils.logtoall("Refresh Auth", "Received access_token" + result.data.access_token)
            this.utils.logtoall("Refresh Auth", "Received refresh_token" + result.data.refresh_token)
            axios.defaults.headers.common['Authorization'] = "Bearer " + Homey.ManagerSettings.get('access_token')
            Homey.ManagerSettings.set('access_token', result.data.access_token)
            Homey.ManagerSettings.set('refresh_token', result.data.refresh_token)
            if (typeof callback === "function")
                callback(null,"")
        })

    }

    async authorize(code, callback) {
        let url = '/oauth/token'
        let options = {
            method: 'GET',
            data: {
                redirect_uri: this._redirectUri,
                client_id: this._clientId,
                client_secret: this._clientSecret,
                code: code,
                grant_type: "authorization_code"
            }, url
        }
        this._GetOptions(options, (err, result) => {
            if (err) {
                callback(err, null)
                //Homey.app.log(err)
            }
            Homey.ManagerSettings.set('access_token', result.data.access_token)
            Homey.ManagerSettings.set('refresh_token', result.data.refresh_token)
            this.utils.logtoall("Token", "Received token: " + result.data.access_token)
            axios.defaults.headers.common['Authorization'] = "Bearer " + result.data.access_token
            setInterval(this.RefreshOath.bind(this), 3600 * 1000)
            callback(null,null);
        //console.log(postdata.data);
        })
    }

    async GetDevices(callback) {
        let foundDevices = []
        this._Get('/devices',(error, result) => {
            this.utils.logtoall("ListDevices ", result.data)
            if (error)
                callback(error)
            result.data.devices.forEach((data) => {
                foundDevices.push({
                    name: data.description,
                    data: {
                        id: data.device_id,
                        battery: parseFloat(data.battery.percent)
                    }
                })
            })
            //Homey.app.log(error)
            callback(null, foundDevices)
            return this._onPairListDevices(foundDevices)
        })
    }

    async _onPairListDevices(result) {
        return [];
    }

    async GetValue(device, action, callback) {
        let datum = new Date();
        datum.setHours(datum.getHours()-1)
       
        this._Get('/devices/' + device + '/' + action + '/?start_at=' + datum.toISOString(), (error, result) => {
            if (error) {
                Homey.app.log(error)
                if (error === 401) {
                    this.authenticate((error, result) => {
                        callback(null, this.GetValue(device, action, callback))
                    })
                }
            }
            else {
                //var value = result.data.values.pop()
                var value = result.data.values[result.data.values.length - 1]
                let collectiontime = new Date(value.datetime)
                this.utils.logtoall("DataCollection", "Collecting " + action + " With Date " + collectiontime.toLocaleString() + " And value " + value.value)
                callback(null, value.value);
                }
            })
    }

    async GetBattery(device, callback) {
        this._Get('/devices/' + device, (error, result) => {
            if (error) {
                //Homey.app.log(error)
                if (error === 401) {
                    this.authenticate((error, result) => {
                        callback(null, this.GetValue(device, action, callback))
                    })
                }
            }
            else {
                var Values = {
                    "battery": result.data.battery.percent,
                    "Events": result.data.ongoing_events
                }
                var value = result.data.battery.percent
                this.utils.logtoall("DeviceCollect", "Collected Battery with value " + value)
                callback(null, Values)
            }
        })
    }
}
module.exports = API
