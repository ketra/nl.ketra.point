'use strict';

const Homey = require('homey');
const appname = "nl.ketra.point";
const util = require('./Lib/utils.js');
const { OAuth2App, OAuth2Util } = require('homey-oauth2app');
const PointOauthClient = require('./Lib/PointOauthClient')
//const PointAPI = require('../../Lib/Api');
//const Hook = require('../../Lib/Webhook');

class PointApp extends OAuth2App {

    onOAuth2Init() {
      this.utils = new util();
      //this.enableOAuth2Debug();
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
}

module.exports = PointApp;
