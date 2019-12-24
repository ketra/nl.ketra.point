'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point";
const util = require('./Lib/utils.js');
const { OAuth2App, OAuth2Util } = require('homey-oauth2app');
const PointOauthClient = require('./Lib/PointOauthClient');

class PointApp extends OAuth2App {

    onOAuth2Init() {
        this.utils = new util();
        this.enableOAuth2Debug();
        this.setOAuth2Config({
            client: PointOauthClient,
            clientId: Homey.env.CLIENT_ID,
            clientSecret: Homey.env.CLIENT_SECRET,
            apiUrl: 'https://api.minut.com/v1/',
            tokenUrl: 'https://api.minut.com/v1/oauth/token',
            authorizationUrl: 'https://api.minut.com/v1/oauth/authorize',
        });

        this.log('PointApp is running...');
        this.log("Main", "App Started");
    }

    get MinutDriver() {
        return Homey.ManagerDrivers.getDriver('Point');
    }
    get MinutHomeDriver() {
        return Homey.ManagerDrivers.getDriver('PointHome');
    }

    async isAuthenticated() {
        try {
            const session = await this._getSession();
            this.log(`isAuthenticated() -> ${!!session}`);
            return !!session;
        } catch (err) {
            this.error('isAuthenticated() -> could not get current session:', err);
            throw new Error('Could not get current OAuth2 session');
        }
    }
    async login() {
        this.log('login()');

        // Try get first saved client
        let client;
        try {
            client = this.getFirstSavedOAuth2Client();
        } catch (err) {
            this.log('login() -> no existing OAuth2 client available');
        }

        // Create new client since first saved was not found
        if (!client || client instanceof Error) {
            client = this.createOAuth2Client({ sessionId: OAuth2Util.getRandomId() });
        }

        this.log('login() -> created new temporary OAuth2 client');

        // Start OAuth2 process
        return new Homey.CloudOAuth2Callback(client.getAuthorizationUrl())
            .on('url', url => Homey.ManagerApi.realtime('url', url))
            .on('code', async code => {
                this.log('login() -> received OAuth2 code');
                try {
                    await client.getTokenByCode({ code });
                } catch (err) {
                    this.error('login() -> could not get token by code', err);
                    Homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', { error: err.message || err.toString() })));
                }
                // get the client's session info
                const session = await client.onGetOAuth2SessionInformation();
                const token = client.getToken();
                const title = session.title;
                client.destroy();

                try {
                    // replace the temporary client by the final one and save it
                    client = this.createOAuth2Client({ sessionId: session.id });
                    client.setTitle({ title });
                    client.setToken({ token });
                    client.save();
                } catch (err) {
                    this.error('Could not create new OAuth2 client', err);
                    Homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', { error: err.message || err.toString() })));
                }

                this.log('login() -> authenticated');
                Homey.ManagerApi.realtime('authorized');

                // Get Toon devices and call resetOAuth2Client on device to re-bind a new OAuth2Client
                // instance to the device
                try {
                    await this.MinutDriver
                        .getDevices()
                        .forEach(minutDevice => minutDevice.resetOAuth2Client({
                            sessionId: session.id,
                            configId: this.MinutDriver.getOAuth2ConfigId(),
                        }));
                    await this.MinutHomeDriver
                        .getDevices()
                        .forEach(minutHome => minutHome.resetOAuth2Client({
                            sessionId: session.id,
                            configId: this.MinutHomeDriver.getOAuth2ConfigId(),
                        }));

                } catch (err) {
                    this.error('Could not reset OAuth2 client on Toon device instance', err);
                    Homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', { error: err.message || err.toString() })));
                }
                this.log('login() -> reset devices to new OAuth2 client');
            })
            .generate();
    }
    async logout() {
        this.log('logout()');
        const session = await this._getSession();
        const sessionId = Object.keys(session)[0];
        this.deleteOAuth2Client({ sessionId, configId: session.configId });

        // Get Minut devices and mark as unavailable
        return Promise.all(
            this.MinutDriver
                .getDevices()
                .map(function (minutDevice) { 
                    minutDevice.unreadyDevice();
                    minutDevice.setUnavailable(Homey.__('authentication.re-authorize')); 
                }),
            this.MinutHomeDriver
                .getDevices()
                .map(function (minutHome) {
                    minutHome.unreadyDevice();
                    minutHome.setUnavailable(Homey.__('authentication.re-authorize'));
                })
        );
    }

    async _getSession() {
        let sessions = null;
        try {
            sessions = this.getSavedOAuth2Sessions();
            console.log(sessions);
        } catch (err) {
            this.error('isAuthenticated() -> error', err.message);
            throw err;
        }
        if (Object.keys(sessions).length > 1) {
            session.forEach(ses => {
                let sessionId = Object.keys(ses)[0];
                this.deleteOAuth2Client({ sessionId, configId: ses.configId });
            });
            throw new Error('Multiple OAuth2 sessions found, not allowed.');
        }
        this.log('_getSession() ->', Object.keys(sessions).length === 1 ? Object.keys(sessions)[0] : 'no session found');
        return Object.keys(sessions).length === 1 ? sessions : null;
    }
}

module.exports = PointApp;
