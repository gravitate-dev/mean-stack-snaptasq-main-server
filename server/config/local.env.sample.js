'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
    DOMAIN: 'http://snaptasq.com:9000',
    SESSION_SECRET: 'snaptasq-secret',

    FACEBOOK_ID: '764169247036130',
    FACEBOOK_SECRET: '6cd7e08d22761e523f7017f60feb28a1',

    // Control debug level for modules using visionmedia/debug
    DEBUG: ''
};
