'use strict';

var _ = require('lodash');
var Email = require('./email.model');
var config = require('../../config/environment');
var sendgrid = require('sendgrid')(config.sendGridApiKey);

exports.sendCommunityJoinCode = function(req, res, emailaddress, communityName, joinCode, cb) {
    var email = new sendgrid.Email();
    email.addTo(emailaddress);
    var helpText = "Join Community " + communityName;
    email.subject = helpText;
    email.from = 'admin@snaptasq.com';
    email.html = helpText;
    // add filter settings one at a time 
    email.addFilter('templates', 'enable', 1);
    email.addFilter('templates', 'template_id', '57cfefac-5046-40ba-b08b-a43e8471e7ed');
    email.addSubstitution('-communityName-', communityName);
    email.addSubstitution('-joinCode-', joinCode);

    sendgrid.send(email, function(err, json) {
        if (err) {
            if (res != null)
                res.status(500).json(err);
        } else {
            if (res != null) {
                if (cb != null) {
                    cb(true);
                } else {
                    return res.status(200).send("sent email");
                }
            }
        }
    });
}

exports.sendRequestTaskerHelp = function(req, res, emailaddress, tasklink, tasktitle, taskownername, taskownerimage) {
        var email = new sendgrid.Email();
        email.addTo(emailaddress);
        var helpText = taskownername + " chose you to help with " + tasktitle;
        email.subject = helpText;
        email.from = 'admin@snaptasq.com';
        email.html = helpText;
        // add filter settings one at a time 
        email.addFilter('templates', 'enable', 1);
        email.addFilter('templates', 'template_id', 'a635c71c-40d6-4845-b2b8-6029f5a13135');
        email.addSubstitution('-tasklink-', tasklink);
        email.addSubstitution('-tasktitle-', tasktitle);
        email.addSubstitution('-taskownername-', taskownername);
        email.addSubstitution('-taskownerimage-', taskownerimage);

        sendgrid.send(email, function(err, json) {
            if (err) {
                if (res != null)
                    res.status(500).json(err);
            } else {
                if (res != null)
                    res.status(200).send("sent email");
            }
        });
    }
    /*
     * Send out a verification email
     * NOTE this is not exported by a route and is on purpose. this is called from
     * User.model.js
     */
exports.resendVerification = function(req, res, emailaddress, code) {
    if (config.dontRequireEmailVerification) {
        return res.status(200).json({
            status: "success",
            message: "Debug: email verification is not needed"
        });
    }
    var email = new sendgrid.Email();
    email.addTo(emailaddress);
    email.subject = "Please Verify Your Email Address";
    email.from = 'admin@snaptasq.com';
    email.html = '<a href="' + config.host.url + 'api/users/verify/email/' + code + '">' + config.host.url + 'api/users/verify/email/' + code + '</a>';
    // add filter settings one at a time 
    email.addFilter('templates', 'enable', 1);
    email.addFilter('templates', 'template_id', 'f28918ba-475d-4f32-8269-6983ee424362');
    email.addSubstitution('-email-', emailaddress);

    sendgrid.send(email, function(err, json) {
        if (err) {
            res.status(500).json({
                status: "error",
                message: 'Our Verification Email System is currently down :-(. Please try resending an email in your <a href="/settings"><i class="fa fa-cog"></i>&nbsp;settings page</a>'
            })
        } else {
            res.status(200).json({
                status: "success",
                message: 'Email has been sent to ' + emailaddress
            })
        }
    });
}

/*
 * Send out a verification email
 * NOTE this is not exported by a route and is on purpose. this is called from
 * User.model.js
 * code1 is the forgotCode
 * code2 is the sha1 of code1
 */
exports.sendForgotPasswordEmail = function(req, res, emailaddress, code1, code2) {
    var email = new sendgrid.Email();
    email.addTo(emailaddress);
    email.subject = "Reset Your Password";
    email.from = 'admin@snaptasq.com';
    email.html = '<a href="' + config.host.url + 'resetPassword/' + code1 + '/' + code2 + '">' + config.host.url + 'resetPassword/' + code1 + '/' + code2 + '</a>';
    // add filter settings one at a time 
    email.addFilter('templates', 'enable', 1);
    email.addFilter('templates', 'template_id', '0f601f82-f288-4b5b-a0f3-1cbb01bc5b9a');
    email.addSubstitution('-email-', emailaddress);

    sendgrid.send(email, function(err, json) {
        if (err) {
            res.status(500).json({
                status: "error",
                message: 'Our Email System is currently down :-(. Please try again later.'
            })
        } else {
            res.status(200).json({
                status: "success",
                message: 'Check your inbox! We sent you a reset password email to ' + emailaddress
            })
        }
    });
}

exports.sendVerificationSilent = function(emailaddress, code) {
    if (config.dontRequireEmailVerification) {
        return 1;
    }
    var email = new sendgrid.Email();
    email.addTo(emailaddress);
    email.subject = "Please Verify Your Email Address";
    email.from = 'admin@snaptasq.com';
    email.html = '<a href="' + config.host.url + 'api/users/verify/' + code + '">' + config.host.url + 'api/users/verify/' + code + '</a>';
    // add filter settings one at a time 
    email.addFilter('templates', 'enable', 1);
    email.addFilter('templates', 'template_id', 'f28918ba-475d-4f32-8269-6983ee424362');
    email.addSubstitution('-email-', emailaddress);

    sendgrid.send(email, function(err, json) {
        if (err) {
            return 1;
        } else {
            return 0;
        }
    });
}

function handleError(res, err) {
    return res.status(500).send(err);
}

exports.testSendEmail = function(req, res) {
    var userImage = "assets/logos/no_avatar.gif"
    var taskOwnerName = "Billy Bob";
    exports.sendRequestTaskerHelp(req, res, "robertirribarren@gmail.com", "www.google.com", "Help with the walrus", taskOwnerName, userImage)
}
