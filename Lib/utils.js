'use strict';

const Homey = require('homey');
const rp = require('request-promise-native');
const axios = require('axios')

class util {

    constructor() {

        this._clientId = Homey.env.CLIENT_ID;
        this._clientSecret = Homey.env.CLIENT_SECRET;
        this._oAuth2AuthorizationUrl = `https://api.minut.com/v1/oauth/authorize`;
        this._oAuth2TokenUrl = `https://api.minut.com/v1/oauth/token`
        this._apiUrl = `https://api.minut.com/v1/`;
        this._redirectUri = 'https://callback.athom.com/oauth2/callback';
        this._token = null;
        axios.defaults.baseURL = 'https://api.minut.com/v1/';

    }

    async startOath(socket) {

        let authrul = this._oAuth2AuthorizationUrl + '?client_id=' + this._clientId + '&response_type=code&redirect_uri=' + this._redirectUri
        this.logtoall("Pair", "Started Pairing. on url " + authrul)
        let myOAuth2Callback = new Homey.CloudOAuth2Callback(authrul)
        myOAuth2Callback
            .on('url', url => {

                // dend the URL to the front-end to open a popup
                socket.emit('url', url);

            })
            .on('code', code => {
                this.logtoall("Pair", "Received Code " + code)
                this.authorize(code).then(function() {
                    console.log("Authenticated succesfully")
                    socket.emit('authorized');
                }).catch(function(err) {
                    this.logtoall("Pair", "Error Received on Pair: " + err)
                    socket.emit('error', err);
                })
            })
            .generate()
            .catch(err => {
                this.logtoall("Pair", "Error Received on Pair: " + err)
                socket.emit('error', err);
            })

    }

    logtoall(action, text) {
        var d = new Date();
        console.log(d.toLocaleString() + " - " + text)
        Homey.ManagerApi.realtime(action, text)
    }

    async authorize(code)
    {
        axios.post('/oauth/token', {
                redirect_uri: this._redirectUri,
                client_id: this._clientId,
                client_secret: this._clientSecret,
                code: code,
                grant_type: "authorization_code"
        })
            .then(function(response) {
                console.log("Token", "Received token: " + response.data.access_token)
                axios.defaults.headers.common['Authorization'] = response.data.access_token
                console.log(response.data);
                Promise.resolve();
            })
        .catch(function (error) {
            console.log(error);
            Promise.reject(error);
            });
        return Promise();
}


}
module.exports = util
