'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point";
const util = require('./Lib/utils.js');
const {
  OAuth2App,
  OAuth2Util
} = require('homey-oauth2app');
const PointOauthClient = require('./Lib/PointOauthClient');

class PointApp extends OAuth2App {

  static OAUTH2_CLIENT = PointOauthClient; // Default: OAuth2Client
  static OAUTH2_DEBUG = true; // Default: false
  static OAUTH2_MULTI_SESSION = false; // Default: false


  onOAuth2Init() {
    this.utils = new util();
    this.logger_ative = false;
    //this.enableOAuth2Debug();

    this.log('PointApp is running...');
    this.log("Main", "App Started");
    this.homey.settings.set('myLog', '');
    this.logger_ative = this.homey.settings.get('myLogActive');
    this.homey.settings.on('set', function (setting) {
      this.log(`setting changed ${setting}`)
      if (setting === 'myLogActive')
      {
        let active = this.homey.settings.get('myLogActive');
        this.log(`setting mylogactive to ${active}`)
        this.homey.app.logger_ative = active;
      }
    });
  }

  get MinutDriver() {
    return this.homey.ManagerDrivers.getDriver('Point');
  }
  get MinutHomeDriver() {
    return this.homey.ManagerDrivers.getDriver('PointHome');
  }

  async isAuthenticated() {
    try {
      const session = await this._getSession();
      console.log(session)
      this.log(`isAuthenticated() -> ${!!session}`);
      return !!session;
    } catch (err) {
      this.error('isAuthenticated() -> could not get current session:', err);
      this.mylog('isAuthenticated() -> could not get current session:', err);
      throw new Error('Could not get current OAuth2 session');
    }
  }
  async login() {
    this.mylog('login()');

    // Try get first saved client
    let client;
    try {
      client = this.getFirstSavedOAuth2Client();
    } catch (err) {
      this.log('login() -> no existing OAuth2 client available');
    }

    // Create new client since first saved was not found
    if (!client || client instanceof Error) {
      client = this.createOAuth2Client({
        sessionId: OAuth2Util.getRandomId()
      });
    }

    this.log('login() -> created new temporary OAuth2 client');

    // Start OAuth2 process
    return new this.homey.CloudOAuth2Callback(client.getAuthorizationUrl())
      .on('url', url => this.homey.ManagerApi.realtime('url', url))
      .on('code', async code => {
        this.log('login() -> received OAuth2 code');
        try {
          await client.getTokenByCode({
            code
          });
        } catch (err) {
          this.error('login() -> could not get token by code', err);
          this.homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', {
            error: err.message || err.toString()
          })));
        }
        // get the client's session info
        const session = await client.onGetOAuth2SessionInformation();
        const token = client.getToken();
        const title = session.title;
        client.destroy();

        try {
          // replace the temporary client by the final one and save it
          client = this.createOAuth2Client({
            sessionId: session.id
          });
          client.setTitle({
            title
          });
          client.setToken({
            token
          });
          client.save();
        } catch (err) {
          this.error('Could not create new OAuth2 client', err);
          this.homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', {
            error: err.message || err.toString()
          })));
        }

        this.mylog('login() -> authenticated');
        this.homey.ManagerApi.realtime('authorized');

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
          this.homey.ManagerApi.realtime('error', new Error(Homey.__('authentication.re-login_failed_with_error', {
            error: err.message || err.toString()
          })));
        }
        this.mylog('login() -> reset devices to new OAuth2 client');
      })
      .generate();
  }
  async logout() {
    this.log('logout()');
    const session = await this._getSession();
    const sessionId = Object.keys(session)[0];
    this.deleteOAuth2Client({
      sessionId,
      configId: session.configId
    });

    // Get Minut devices and mark as unavailable
    return Promise.all(
      this.MinutDriver
      .getDevices()
      .map(function(minutDevice) {
        minutDevice.unreadyDevice();
        minutDevice.setUnavailable(Homey.__('authentication.re-authorize'));
      }),
      this.MinutHomeDriver
      .getDevices()
      .map(function(minutHome) {
        minutHome.unreadyDevice();
        minutHome.setUnavailable(Homey.__('authentication.re-authorize'));
      })
    );
  }
  async GetWebhooks() {
    // Try get first saved client
    let client;
    try {
      client = this.getFirstSavedOAuth2Client();
    } catch (err) {
      this.mylog('GetWebhooks() -> no existing OAuth2 client available');
    }
    if (!client || client instanceof Error) {
      this.error('Could not get oauth client.');
    }
    let webhooks = await client.GetWebhooks();
    return webhooks;
  }

  async RefreshWebhooks() {
    // Try get first saved client
    let client;
    try {
      client = this.getFirstSavedOAuth2Client();
    } catch (err) {
      this.mylog('RefreshWebhooks() -> no existing OAuth2 client available');
    }
    if (!client || client instanceof Error) {
      this.error('Could not get oauth client.');
    }
    let webhooks = await client.RefreshWebhooks();
    return webhooks;
  }

  async DeleteOldWebhooks() {
    // Try get first saved client
    let client;
    try {
      client = this.getFirstSavedOAuth2Client();
    } catch (err) {
      this.mylog('DeleteOldWebhooks() -> no existing OAuth2 client available');
    }
    if (!client || client instanceof Error) {
      this.error('Could not get oauth client.');
    }
    let webhooks = await client.DeleteOldWebhooks();
    return webhooks;
  }

  // Write information to history and cleanup 20% when history above 2000 lines
  async writeLog(logLine) {
    // console.log(logLine);
    let savedHistory = this.homey.settings.get('myLog');
    if (savedHistory != undefined) {
      // cleanup history
      let lineCount = savedHistory.split(/\r\n|\r|\n/).length;
      if (lineCount > 2000) {
        let deleteItems = parseInt(lineCount * 0.2);
        let savedHistoryArray = savedHistory.split(/\r\n|\r|\n/);
        let cleanUp = savedHistoryArray.splice(-1 * deleteItems, deleteItems, "");
        savedHistory = savedHistoryArray.join('\n');
      }
      // end cleanup
      logLine = logLine + "\n" + savedHistory;
    }
    this.homey.settings.set('myLog', logLine);
    logLine = "";
  }
  async mylog(...message)
  {
    let myLogActive = this.logger_ative
    if (!myLogActive) return;
    let logdate = this.getDateTime();
    this.writeLog(logdate + ":" + message[0]);
    this.log(message);
  }
  async _getSession() {
    let sessions = null;
    try {
      sessions = this.getSavedOAuth2Sessions();
      console.log(sessions);
    } catch (err) {
      this.mylog('isAuthenticated() -> error:' + err.message)
      this.error('isAuthenticated() -> error', err.message);
      throw err;
    }
    if (Object.keys(sessions).length > 1) {
      this.log('_getSession() -> Found more than 1 session.');
      Object.keys(sessions).forEach(ses => {
        try {
          this.log('_getSession() -> ',sessions[ses]);
          this.log('_getSession() -> ',sessions[ses].configId);
          let sessionId = ses
          this.deleteOAuth2Client({
            ses,
            configId: sessions[ses].configId
          });
        } catch (e) {
          this.mylog('Session: ' + e.message)
        }
      });
      throw new Error('Multiple OAuth2 sessions found, not allowed.');
    }
    this.log('_getSession() ->', Object.keys(sessions).length === 1 ? Object.keys(sessions)[0] : 'no session found');
    return Object.keys(sessions).length === 1 ? sessions : null;
  }

  getDateTime() {
    let date = new Date();
    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    let min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    let sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    let msec = ("00" + date.getMilliseconds()).slice(-3)
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return day + "-" + month + "-" + year + "  ||  " + hour + ":" + min + ":" + sec + "." + msec + "  ||  ";
}
}

module.exports = PointApp;
