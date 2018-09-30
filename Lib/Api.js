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
        //this.authenticate()
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

    async ListDevices(socket) {
        await this.authenticate();
        socket.on('list_devices', (data, callback) => {
            this.GetDevices(callback);
        })
    }

    async startOath(socket) {

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
                    this.utils.logtoall("Startauth","Authenticated succesfully")
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
        socket.on('list_devices', (data, callback) => {
            this.GetDevices(callback);
        })

    }
    async RefreshOath() {
        this.utils.logtoall("Refresh Auth","Refresing Oath Token.")
        let postdata = await axios.post('/oauth/token', {
            redirect_uri: this._redirectUri,
            client_id: this._clientId,
            client_secret: this._clientSecret,
            refresh_token: Homey.ManagerSettings.get('refresh_token'),
            grant_type: "refresh_token"
        })
        this.utils.logtoall("Refresh Auth", "Received access_token " + postdata.data.access_token)
        this.utils.logtoall("Refresh Auth", "Received refresh_token " + postdata.data.refresh_token)
        Homey.ManagerSettings.set('access_token', postdata.data.access_token)
        Homey.ManagerSettings.set('refresh_token', postdata.data.refresh_token)
    }

    async authorize(code) {
        let postdata = await axios.post('/oauth/token', {
            redirect_uri: this._redirectUri,
            client_id: this._clientId,
            client_secret: this._clientSecret,
            code: code,
            grant_type: "authorization_code"
        })
        Homey.ManagerSettings.set('access_token', postdata.data.access_token)
        Homey.ManagerSettings.set('refresh_token', postdata.data.refresh_token)
        this.utils.logtoall("Token", "Received token: " + postdata.data.access_token)
        axios.defaults.headers.common['Authorization'] = "Bearer " + postdata.data.access_token
        setInterval(this.RefreshOath.bind(this), 3600 * 1000)
        //console.log(postdata.data);
    }

    async GetDevices(callback) {
        let foundDevices = []
        let result = await axios.get('/devices')
        //console.log(result.data.devices);
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
    }
    async _onPairListDevices(result) {
        return [];
    }

    async GetValue(device, action) {
        try {
            let result = await axios.get('/devices/' + device + '/' + action)
            this.utils.logtoall("DataCollection","Collecting "+ action)
            return result.data.values[0].value
        }
        catch (err) {
            if (err.statusCode === 401) {
                await this.authenticate()
                return this.Getsound(device)
            }

            console.log(err)
        }
    }
}
module.exports = API
