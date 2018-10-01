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
    }

    async authenticate() {
        try {
            setInterval(this.RefreshOath.bind(this), 3600 * 1000)
            axios.defaults.headers.common['Authorization'] = "Bearer " + Homey.ManagerSettings.get('access_token')
            this.RefreshOath();
        }
        catch (err) {

            console.log(err)
        }
    }
    async VerifyAuth(socket)
    {
        if (Homey.ManagerSettings.get('access_token') === undefined)
            return false
        else
        {
            this.RefreshOath((err, result) => {
                if (err)
                    return false;
                return true
            })
        }
    }

    async startOath(socket) {
        if (!this.VerifyAuth()) {

            let authrul = this._oAuth2AuthorizationUrl + '?client_id=' + this._clientId + '&response_type=code&redirect_uri=' + this._redirectUri
            this.utils.logtoall("Pair", "Started Pairing. on url " + authrul)
            let myOAuth2Callback = new Homey.CloudOAuth2Callback(authrul)
            myOAuth2Callback
                .on('url', url => {

                    // dend the URL to the front-end to open a popup
                    socket.emit('url', url);

                })
                .on('code', code => {
                    this.utils.logtoall("Pair", "Received Code " + code)
                    this.authorize(code).then(function () {
                        this.utils.logtoall("Startauth", "Authenticated succesfully")
                        socket.emit('authorized');
                    }).catch(function (err) {
                        this.utils.logtoall("Pair", "Error Received on Pair: " + err)
                        socket.emit('error', err);
                    })
                })
                .generate()
                .catch(err => {
                    this.utils.logtoall("Pair", "Error Received on Pair: " + err)
                    socket.emit('error', err);
                })
        }
        socket.on('list_devices', (data, callback) => {
            this.GetDevices(callback);
        })

    }
    async _Get(url, callback) {
        axios.get(url).then(function (result) {
            callback(null,result)
        }).catch(function (err) {
            if (err.statusCode === 401)
            {
                this._authenticated = false;
                callback(401, null)
            }
        })
    }
    async _GetOptions(options, callback)
    {
        axios(options).then(function (result) {
            callback(null,result)
        }).catch(function (err) {
            if (err.statusCode === 401) {
                this._authenticated = false;
                callback(401, null)
            }
        })
    }

    async RefreshOath(callback) {
        this.utils.logtoall("Refresh Auth", "Refresing Oath Token.")
        url = '/oauth/token'
        const options = {
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
            if (err)
                Promise.reject(err)
            this.utils.logtoall("Refresh Auth", "Received access_token" + result.data.access_token)
            this.utils.logtoall("Refresh Auth", "Received refresh_token" + result.data.refresh_token)
            Homey.ManagerSettings.set('access_token', result.data.access_token)
            Homey.ManagerSettings.set('refresh_token', result.data.refresh_token)
            return Promise.resolve()   
        })

    }

    async authorize(code) {
        url = '/oauth/token'
        const options = {
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
            if (err)
                Promise.reject(err)
            Homey.ManagerSettings.set('access_token', postdata.data.access_token)
            Homey.ManagerSettings.set('refresh_token', postdata.data.refresh_token)
            this.utils.logtoall("Token", "Received token: " + postdata.data.access_token)
            axios.defaults.headers.common['Authorization'] = "Bearer " + postdata.data.access_token
            setInterval(this.RefreshOath.bind(this), 3600 * 1000)
        //console.log(postdata.data);
        })
    }

    async GetDevices(callback) {
        let foundDevices = []
        this._Get((error, result) => {
            if (error)
                callback(error)
            result.data.devices.forEach((data) => {
                foundDevices.push({
                    name: data.description,
                    data: {
                        id: data.device_id
                    }
                })
            })
            console.log(foundDevices)
            callback(null, foundDevices)
            return this._onPairListDevices(foundDevices)
        })
    }

    async _onPairListDevices(result) {
        return [];
    }

    async GetValue(device, action) {
        try {
            this._Get('/devices/' + device + '/' + action, (error, result) => {
                if (error)
                    
                this.utils.logtoall("DataCollection", "Collecting " + action)
                return result.data.values[0].value
            })
            let result = await axios.get('/devices/' + device + '/' + action)

        }
        catch (err) {
            if (err.statusCode === 401) {
                await this.authenticate()
                return this.GetValue(device, action)
            }

            console.log(err)
        }
    }
}
module.exports = API
