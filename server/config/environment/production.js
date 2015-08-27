'use strict';

// Production specific configuration
// =================================
module.exports = {
    // Server IP
    ip: process.env.OPENSHIFT_NODEJS_IP ||
        process.env.IP ||
        undefined,

    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT ||
        process.env.PORT ||
        9000,

    // MongoDB connection options
    mongo: {
        uri: process.env.MONGOLAB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
            'mongodb://localhost/snaptasq'
    },
    dontRequireEmailVerification: false,

    host: {
        url: "https://snaptasq.com/"
    },

    facebook: {
        clientID: process.env.FACEBOOK_ID || '764169247036130',
        clientSecret: process.env.FACEBOOK_SECRET || '6cd7e08d22761e523f7017f60feb28a1',
        callbackURL: 'https://snaptasq.com/auth/facebook/callback'
    },
};
