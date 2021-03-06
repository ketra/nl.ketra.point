'use strict';

const Homey = require('homey');

module.exports = [
    {
        description: 'Get logged in state',
        method: 'GET',
        path: '/login/',
        fn: async (args, callback) => {
            // Check if app.js is done
            if (!Homey || !Homey.app || typeof Homey.app.isAuthenticated !== 'function') {
                return callback(new Error(Homey.__('api.retry')));
            }

            // Try to get the authenticated state
            try {
                const authenticated = await Homey.app.isAuthenticated();
                return callback(null, authenticated);
            } catch (err) {
                return callback(new Error(Homey.__('api.error_get_authenticated_state', { error: err.message || err.toString() })));
            }
        },
    },
    {
        description: 'Get Webhooks',
        method: 'GET',
        path: '/webhooks/',
        fn: async (args, callback) => {
            // Check if app.js is done
            if (!Homey || !Homey.app || typeof Homey.app.GetWebhooks !== 'function') {
                return callback(new Error(Homey.__('api.retry')));
            }
            // Try to get the authenticated state
            try {
                const webhooks = await Homey.app.GetWebhooks();
                return callback(null, webhooks);
            } catch (err) {
                return callback(new Error(Homey.__('api.error_get_webhooks', { error: err.message || err.toString() })));
            }
        },
    },
    {
        description: 'Get Webhooks',
        method: 'POST',
        path: '/webhooks/',
        fn: async (args, callback) => {
            // Check if app.js is done
            if (!Homey || !Homey.app || typeof Homey.app.RefreshWebhooks !== 'function') {
                return callback(new Error(Homey.__('api.retry')));
            }
            // Try to get the authenticated state
            try {
                const webhooks = await Homey.app.RefreshWebhooks();
                return callback(null, webhooks);
            } catch (err) {
                return callback(new Error(Homey.__('api.error_get_webhooks', { error: err.message || err.toString() })));
            }
        },
    },
    {
        description: 'Get Webhooks',
        method: 'DELETE',
        path: '/webhooks/',
        fn: async (args, callback) => {
            // Check if app.js is done
            if (!Homey || !Homey.app || typeof Homey.app.RefreshWebhooks !== 'function') {
                return callback(new Error(Homey.__('api.retry')));
            }
            // Try to get the authenticated state
            try {
                const webhooks = await Homey.app.DeleteOldWebhooks();
                return callback(null, webhooks);
            } catch (err) {
                return callback(new Error(Homey.__('api.error_get_webhooks', { error: err.message || err.toString() })));
            }
        },
    },
    {
        description: 'Set logged in state',
        method: 'POST',
        path: '/login/',
        fn: async (args, callback) => {
            if (!args || !args.body || !args.body.hasOwnProperty('state') ||
                typeof args.body.state !== 'boolean') {
                return callback(new Error(Homey.__('api.retry')));
            }
            const loginState = args.body.state;
            if (loginState === true) { // login
                if (!Homey || !Homey.app || typeof Homey.app.login !== 'function') {
                    return callback(new Error(Homey.__('api.retry')));
                }
                try {
                    await Homey.app.login();
                    return callback(null, true);
                } catch (err) {
                    return callback(new Error(Homey.__('api.error_login_failed', { error: err.message || err.toString() })));
                }
            } else if (loginState === false) { // logout
                if (!Homey || !Homey.app || typeof Homey.app.logout !== 'function') {
                    return callback(new Error(Homey.__('api.retry')));
                }
                try {
                    await Homey.app.logout();
                    return callback(null, true);
                } catch (err) {
                    return callback(new Error(Homey.__('api.error_logout_failed', { error: err.message || err.toString() })));
                }
            }
        },
    },

];
