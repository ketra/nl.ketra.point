'use strict';

const Homey = require('homey');

module.exports = {
    async GetLogin({homey, body}) {
        return await homey.app.isAuthenticated();
    },

    async GetWebhooks({homey, body}) {
        return await homey.app.GetWebhooks();
    },

    async PostWebhooks({homey, body}) {
        return await homey.app.RefreshWebhooks();

    },

    async DeleteWebhooks({homey, body}) {
        return await homey.app.DeleteOldWebhooks();
    },

    async PostLogin({homey, body}) {
        const loginState = body.state;
        if (loginState === true) { // login
            return await homey.app.login();
        } else if (loginState === false) { // logout
            return await homey.app.logout();
        }
    }

}
