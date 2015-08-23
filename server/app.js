/**
 * Main application file
 */
 
'use strict'; 

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var express = require('express')
    , cookieParser = require('cookie-parser')
    , mongoose = require('mongoose')
    , config = require('./config/environment')
    , recaptcha = require('./config/recaptcha')
    , _ = require('lodash')
    , seo = require('mean-seo');


// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

var myCookieParser = cookieParser(config.secrets.session);

// Setup server
var app = express();
var session = require('express-session');

var sessionStore;
var storeSessionMongo = false;
if (storeSessionMongo) {
var MongoStore = require('connect-mongo')(session);
sessionStore = new MongoStore({
        url: config.mongo.uri
});
} else {
var RedisStore = require('connect-redis')(session);
sessionStore = new RedisStore({});
}
app.use( myCookieParser);
app.use(session({
  secret: config.secrets.session,
  resave: false,
  saveUninitialized: true,
  store:sessionStore 
}));

app.disable('x-powered-by');

var server = require('http').createServer(app);
console.log('Attempting to launch Express server listening on %d, in %s mode', config.port, app.get('env'));
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});
/*
app.use(seo({
    cacheClient: 'disk', // Can be 'disk' or 'redis'
    cacheDuration: 2 * 60 * 60 * 24 * 1000, // In milliseconds for disk cache
}));
*/
//require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);
require('./api/notify');
// Expose app
exports = module.exports = app;