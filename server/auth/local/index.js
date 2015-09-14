'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

/*
 * this only happens when the user logs in via the email
 * This does not happen when they register nor does it happen when they use facebook
 **/
router.post('/', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        var error = err || info;
        if (error) return res.json(401, error);
        if (!user) return res.json(404, {
            message: 'Something went wrong, please try again.'
        });
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
        var token = auth.signToken(user._id, user.role);
        req.session.userId = user._id;
        res.json({
            token: token,
            user: user
        });
    })(req, res, next)
});

module.exports = router;
