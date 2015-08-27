'use strict';

// Development specific configuration
// ==================================
module.exports = {
    // MongoDB connection options
    mongo: {
        uri: 'mongodb://localhost/snaptasq-dev'
    },

    // host name
    host: {
        url: "http://localhost:8000/"
    },

    // Server port
    port: 8000,

    dontRequireEmailVerification: true,

    seedDB: true,

    facebook: {
        clientID: process.env.FACEBOOK_ID || '764169247036130',
        clientSecret: process.env.FACEBOOK_SECRET || '6cd7e08d22761e523f7017f60feb28a1',
        callbackURL: 'http://localhost:8000/auth/facebook/callback'
    },
};
