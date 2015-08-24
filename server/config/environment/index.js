'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    betaTrails: true,

    sendGridApiKey: "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",

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Should we populate the DB with sample data?
    seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'share-task-secret'
    },


    SMS_TWILIO_SSID: 'ACcee07eaa0b1f231575c492964366dca2',
    SMS_TWILIO_AUTH_TOKEN: 'ca0b320098e306301fbde68272770830',
    TWILIO_PHONE_NUMBER: '+16509008475',

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],

    // MongoDB connection options
    mongo: {
        options: {
            db: {
                safe: true
            }
        }
    },

    facebook: {
        clientID: process.env.FACEBOOK_ID || '764169247036130',
        clientSecret: process.env.FACEBOOK_SECRET || '6cd7e08d22761e523f7017f60feb28a1',
        callbackURL: (process.env.HOST || '') + '/auth/facebook/callback'
    },

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});
