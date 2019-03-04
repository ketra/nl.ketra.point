'use strict';

const Homey = require('homey');
//const axios = require('axios');
const phin = require('phin');
const util = require('../../Lib/utils');

class API {

    constructor() {

        this._clientId = Homey.env.CLIENT_ID;
        this._clientSecret = Homey.env.CLIENT_SECRET;
        this._oAuth2AuthorizationUrl = `https://api.minut.com/v1/oauth/authorize`;
        this._oAuth2TokenUrl = `https://api.minut.com/v1/oauth/token`
        this._apiUrl = `https://api.minut.com/v1/`;
        this._redirectUri = 'https://callback.athom.com/oauth2/callback';
        this._token = null;
        this.utils = new util();
        this._authenticated = false;
        this.OauthTimer;
        this.options = {}
        this.baseURL = 'https://api.minut.com/v1'
        this.options.headers = {}
    }

    GetUrl(url)
    {
      return this.baseURL + url
    }

    async authenticate(callback) {
        try {
            clearInterval(this.OauthTimer);
            this.OauthTimer = setInterval(this.RefreshOath.bind(this), 1700 * 1000);
            //axios.defaults.headers.common['Authorization'] = "Bearer "
            this.setHeader(Homey.ManagerSettings.get('access_token'));
            if (this.getSecondsBetweenDates(Homey.ManagerSettings.get('Refreshtimer')) > 600) return;
            //this.RefreshOath((error, result) => { });
            this.VerifyAuth(null, (error, result) => { });
            callback();
        }
        catch (err) {
            console.log("Error during authenticate");
            console.log(err);
        }
    }

    getSecondsBetweenDates(startDate) {
        var d = new Date();
        startDate = new Date(startDate);
        if (!startDate) return 0;
        console.log('Checking : ' + startDate + ' Against : ' + d);
        var diff = startDate.getTime() - d.getTime();
        diff = diff / 1000;
        return Math.round(diff);
    }

    async VerifyAuth(socket, callback)
    {
        try {
            if (Homey.ManagerSettings.get('access_token') === undefined)
                callback(new Error("No acces_token found"), null);
            else if (this.getSecondsBetweenDates(Homey.ManagerSettings.get('Refreshtimer')) > 600) {
                Homey.app.log("Already Authorized");
                this.setHeader(Homey.ManagerSettings.get('access_token'));
                callback();
                return;
            }
            else {
                this.RefreshOath((err, result) => {
                    if (err) {
                        console.log("line 45 " + err);
                        callback(err, null);
                    }
                    else {
                        if (socket)
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

    async startOath(socket, callback) {
        this.VerifyAuth(socket, (err, result) => {
            //if (err) {
            let authrul = this._oAuth2AuthorizationUrl + '?client_id=' + this._clientId + '&response_type=code&redirect_uri=' + this._redirectUri;
            console.log("Started Pairing. on url " + authrul);
            //Homey.App.log("Pair", "Started Pairing. on url " + authrul)
            let myOAuth2Callback = new Homey.CloudOAuth2Callback(authrul);
            myOAuth2Callback
                .on('url', url => {
                    // dend the URL to the front-end to open a popup
                    socket.emit('url', url);
                })
                .on('code', code => {
                    this.utils.logtoall("code", "Received Code " + code);
                    this.authorize(code, (err, result) => {
                        if (err) {
                            console.log(err);
                            this.utils.logtoall("Pair", "Error Received on Pair: " + err);
                            socket.emit('error', err);
                        }
                        else {
                            this.utils.logtoall("Startauth", "Authenticated succesfully");
                            socket.emit('authorized');
                        }
                    });
                })
                .generate()
                .catch(err => {
                    console.log(err);
                    this.utils.logtoall("Pair", "Error Received on Pair: " + err);
                    socket.emit('error', err);
                });
            //socket.on('list_devices', (data, callback) => {
            //    this.utils.logtoall("Oauth process", "Setup ListDevices");
            //    this.GetDevices(callback);
        //});
                callback();
                
            //}
            //else {
            //    socket.emit('authorized');
            //    socket.on('list_devices', (data, callback) => {
            //        this.utils.logtoall("Oauth process", "Setup ListDevices");
            //        this.GetDevices(callback);
            //    });
            //}
        });


    }
    setHeader(token) {
        if (token) {
            var headers = { authorization: "bearer " + token };
            this.options.headers = headers;
            console.log("Header set to: " + token);
        }
        else {
            console.log("Token Not Found");
        }
    }

    getUrl(url) {
        return this.baseURL + url;
    }

    async _Get(url, callback) {
        try {
            var options = this.options;
            options.url = this.getUrl(url);
            options.parse = 'json';
            //console.log(options);
            phin(options).then(function (result) {
                if (result.statusCode === 401) { callback(401); return; }
                //console.log(result.body)
                callback(null, result.body)
            }).catch(function (err) {
                //Homey.app.log(err)
                //if (err.response.status === 401) {
                //    callback(401, null)
                //}
                callback(err, null);
            })
        }
        catch (err) {
            console.log(err);
        }
    }
    async _GetOptions(options, headers, callback) {
        options.headers = {
            "Content-Type": "application/json", "Cache-Control": "no-cache" };
        if (headers) {
            if (this.options.headers.authorization === undefined) { callback("No Authentication Found"); return; }
            options.headers.authorization = this.options.headers.authorization;
        }
        options.parse = 'json';
        console.log(options);
        try {
            phin(options).then((result) => {
                if (result.statusCode === 401) { callback(401); return; }
                console.log(result.body);
                callback(null, result.body);
            }).catch(function (err) {
                //Homey.app.log(err)
                //if (err.response.status === 401) {
                //    callback(401, null)
                //}
                callback(err, null);
            });
        }
        catch (err)
        {
            console.log(err);
        }
    }
    async _Post(url, data, callback) {
        //this.utils.logtoall("_POST", "Posting Data" + data);
        //this.utils.logtoall("_POST", "Posting Data");
        //console.log(data)
        var options = this.options;
        options.url = this.getUrl(url);
        options.parse = 'json';
        options.data = data;
        options.method = "POST";
        console.log(options);
        try {
            phin(options).then(function (result) {
                console.log(result.body);
                callback(null, result.body);
            }).catch(function (err) {
                Homey.app.log(err);
                if (err.response.status === 401) {
                    callback(401, null);
                }
                callback(err, null);
            });
        }
        catch (err) {
            callback(err,null)
            console.log(err);
        }
    }

    async _Put(url, data, callback) {
        //this.utils.logtoall("_POST", "Posting Data" + data);
        //this.utils.logtoall("_POST", "Posting Data");
        //console.log(data)
        var options = this.options;
        options.url = this.getUrl(url);
        options.parse = "JSON";
        options.data = data;
        options.method = "PUT";
        //console.log(options);
        try {
            phin(options).then(function (result) {
                //console.log(result.body);
                callback(null, result.body);
            }).catch(function (err) {
                Homey.app.log(err);
                if (err.response.status === 401) {
                    callback(401, null);
                }
                callback(err, null);
            });
        }
        catch (err) {
            callback(err, null)
            console.log(err);
        }
    }

    SetWebhook(callback)
    {
        this.CheckWebhook((err, result) => {
            if (result) {
                Homey.app.log("Already found webhook with id " + result.id);
                callback(null, result);
                return;
            }
            Homey.app.log(err);
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
            };
            this.VerifyAuth(null, (error, result) => {
                if (error) { callback(error); return; }
                this._Post('/webhooks', data, (error, result) => {
                    if (error) {
                        Homey.app.log("Authentication Needed");
                        return;
                    }
                    else {
                        Homey.app.log("Registered webhook with id " + result.hook_id);
                        callback(null, result);
                    }
                });
            });
        });
    }

    CheckWebhook(callback) {
        Homey.app.log("Checking Webhooks");
        this.GetWekhook((err, result) => {
            if (err) {
                Homey.app.log("286: " + err);
                callback(err, null);
                return;
            }
            else {
                var found;
                if (result) {
                    Homey.app.log("Webhooks Found " + result.length);
                    for (var i = 0; i < result.length; i++) {
                        console.log(result[i].url);
                        if (result[i].url === Homey.env.WEBHOOK_URL) {
                            found = result[i];
                            break;
                        }
                    }
                    if (found)
                        callback(null, found);
                    else
                        callback(new Error("No Hooks found"), null);
                }
            }
        });
        return;
    }

    async GetWekhook(callback) {
        try {
            this.utils.logtoall("Webhook", "Collecting Webhooks");
            let url = this.getUrl('/webhooks');
            let options = {
                method: 'GET',
                url
            };
            this._GetOptions(options, true, (err, result) => {
                if (err) {
                    console.log(err);
                    this.VerifyAuth(null, (err, result) => {
                        if (err) { callback(err, null); return; }
                        callback(null, this.GetWekhook(callback));
                        return;
                    });
                }
                else {
                    try {
                        console.log(result);
                        callback(null, result.hooks);
                        return;
                    }
                    catch (err) {
                        Homey.app.log("321: " + err);
                        callback("error", null);
                    }
                }
            });

        }
        catch (err) {
            Homey.app.log("330: " + err);
        }
    }

    async RefreshOath(callback) {
        this.utils.logtoall("Refresh Auth", "Refresing Oath Token.");
        var refreshtoken = Homey.ManagerSettings.get('refresh_token');
        if (refreshtoken === null) { callback("error", null); return };
        let url = this.getUrl('/oauth/token');
        let options = {
            method: 'POST',
            data: {
                redirect_uri: this._redirectUri,
                client_id: this._clientId,
                client_secret: this._clientSecret,
                refresh_token: refreshtoken,
                grant_type: "refresh_token"
            }, url
        }
        this._GetOptions(options, false, (err, result) => {
            //console.log(result)
            if (err) {
                //Homey.App.log(err)
                if (typeof callback === "function")
                    callback(err, null)
                return;
            }
            this.utils.logtoall("Refresh Auth", "Received access_token" + result.access_token)
            this.utils.logtoall("Refresh Auth", "Received refresh_token" + result.refresh_token)
            //axios.defaults.headers.common['Authorization'] = "Bearer " + 
            this.setHeader(Homey.ManagerSettings.get('access_token'))
            Homey.ManagerSettings.set('access_token', result.access_token)
            Homey.ManagerSettings.set('refresh_token', result.refresh_token)
            let datum = new Date();
            datum.setSeconds(datum.getSeconds() + 3600)
            Homey.ManagerSettings.set('Refreshtimer', datum);
            if (typeof callback === "function")
                callback(null,"")
        })

    }

    async authorize(code, callback) {
        if (Homey.ManagerSettings.get('access_token') !== undefined && !code) return;
        try {
            let url = this.getUrl('/oauth/token');
            let options = {
                method: 'POST',
                data: {
                    redirect_uri: this._redirectUri,
                    client_id: this._clientId,
                    client_secret: this._clientSecret,
                    code: code,
                    grant_type: "authorization_code"
                }, url
            }
            this._GetOptions(options, false, (err, result) => {
                if (err) {
                    callback(err, null);
                    //Homey.app.log(err)
                }
                //console.log(result)
                Homey.ManagerSettings.set('access_token', result.access_token);
                Homey.ManagerSettings.set('refresh_token', result.refresh_token);
                this.utils.logtoall("Token", "Received token: " + result.access_token);
                this.setHeader(result.access_token)
                //axios.defaults.headers.common['Authorization'] = "Bearer " + result.data.access_token
                setInterval(this.RefreshOath.bind(this), 3600 * 1000)
                callback(null, null);;
                //console.log(postdata.data);
            })
        }
        catch (err)
        {
            callback(err, null);
        }
    }

async GetDevices(callback) {
    let foundDevices = []
    this._Get('/devices', (error, result) => {
        this.utils.logtoall("ListDevices ", result.data)
        if (error)
            callback(error);
        result.devices.forEach((data) => {
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
    });
}
async GetHomes(callback) {
    let foundDevices = []
    this._Get('/homes', (error, result) => {
        this.utils.logtoall("ListHomes ", result)
        console.log(result)
        if (error)
            callback(error);
        result.homes.forEach((data) => {
            foundDevices.push({
                name: data.name,
                data: {
                    id: data.home_id
                }
            })
        })
        //Homey.app.log(error)
        callback(null, foundDevices)
        return this._onPairListDevices(foundDevices)
    });
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
                //console.log(result)
                var value = result.values[result.values.length - 1]
                let collectiontime = new Date(value.datetime)
                this.utils.logtoall("DataCollection", "Collecting " + action + " With Date " + collectiontime.toLocaleString() + " And value " + value.value)
                callback(null, value.value);
                }
            })
    }
    async GetHomeAlarm(home, callback) {
        this._Get('/homes/' + home, (error, result) => {
            //console.log(error)
            if (error) {
                //Homey.app.log(error)
                if (error === 401) {
                    this.authenticate((error, result) => {
                        callback(null, this.GetHomeDetails(home, action, callback))
                    })
                }
            }
            else {
                try {
                    //console.log(result.alarm_status)
                    if (result.alarm_status == "off")
                        var alarm_status = false;
                    else
                        var alarm_status = true;
                    this.utils.logtoall("HomeCollection", "Collecting alarm state:" + alarm_status);
                    callback(null, alarm_status);
                }
                catch (err)
                {
                    callback(err, null);
                }
            }
        })
    }


    async GetBattery(device, callback) {
        this._Get('/devices/' + device, (error, result) => {
            //console.log(error)
            if (error) {
                //Homey.app.log(error)
                if (error === 401) {
                    this.authenticate((error, result) => {
                        callback(null, this.GetValue(device, action, callback))
                    })
                }
            }
            else {
                //console.log(result)
                var Values = {
                    "battery": result.battery.percent,
                    "Events": result.ongoing_events
                }
                var value = result.battery.percent
                this.utils.logtoall("DeviceCollect", "Collected Battery with value " + value)
                callback(null, Values)
            }
        })
    }
    async SetAlarmStatus(home, status, callback)
    {
        let data = {
            "alarm_status": status
        };
        this._Put("/homes/" + home + "/alarm", data, (err, result) => {
            if(err)
                console.log(error)
            callback();
        })
    }
}
module.exports = API
