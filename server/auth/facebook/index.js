'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var UserController = require('../../api/user/user.controller');
var graph = require('fbgraph');

var mypassport = require('./passport');

var router = express.Router();

// serialize and deserialize
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
router.get('/reauth',
    function(req, res, next) {
        passport.authenticate('facebook', {
            authType: 'rerequest',
            scope: ['email', 'user_friends'],
            failureRedirect: '/connect',
            session: false
        })(req, res, next)
    });
router.get('/',
        function(req, res, next) {
            passport.authenticate('facebook', {
                scope: ['email', 'user_friends'],
                session: false
            })(req, res, next)
        }
    )
    .get('/callback', function(req, res, next) {
        passport.authenticate('facebook', {
            scope: ['email', 'user_friends'],
            session: false
        }, function(err, user, info) {
            if (err || !user) {
                return res.redirect("/inuse");
            }
            var ipAddressAdded = false;
            for (var i = 0; i < user.knownIpAddresses.length; i++) {
                if (user.knownIpAddresses[i].ip == req.ip) {
                    user.knownIpAddresses[i].popularity++;
                    ipAddressAdded = true;
                    break;
                }
            }

            if (ipAddressAdded == false) {
                var newIp = {
                    ip: req.ip,
                    popularity: 0
                };
                user.knownIpAddresses.push(newIp);
            }
            user.markModified('knownIpAddresses');
            user.save(function(err) {
                if (err) {
                    console.error("Error in saving user in setup", err, user);
                }
            });
            req.user = user;
            return next(err, user);
        })(req, res, next)
    }, function(req, res, next) {
        // when there is no req.user it is because not logged in or facebook account already taken
        if (req.errormsg) {
            return res.status(400).json(req.errormsg);
        }
        next();
    }, auth.setTokenCookie);

module.exports = router;
