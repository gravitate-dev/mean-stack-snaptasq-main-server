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

    seedDB: true
};
