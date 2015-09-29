'use strict';
var _ = require('lodash');
var config = require('../../config/environment');
var sms = require('../sms/sms.controller');

/** Callers are responsible for checking if the user has enabled enableNotifications */
exports.sendRequestTaskerHelp = function(number, tasklink, tasktitle, taskownername) {
    if (number == undefined) {
        return console.error("Number is undefined in sendRequestTaskerHelp, tasklink", tasklink);
    }
    var msg = taskownername + " chose you to help with " + tasktitle + ". Go to the tasq page and click start tasq when you are ready to help. " + tasklink;
    sms.text(number, msg);
};

exports.sendTaskerStartedTaskOwner = function(number, tasklink, tasktitle, taskerName) {
    if (number == undefined) {
        return console.error("Number is undefined in sendTaskerStartedTaskOwner, tasklink", tasklink);
    }
    var msg = taskerName + " has started helping you with " + tasktitle + ". " + tasklink;
    sms.text(number, msg);
};

exports.sendFirstApplicantTaskOwner = function(number, tasklink, tasktitle, taskerName) {
    if (number == undefined) {
        return console.error("Number is undefined in sendFirstApplicantTaskOwner, tasklink", tasklink);
    }
    var msg = taskerName + " was first to apply to help you with " + tasktitle + ". " + tasklink;
    sms.text(number, msg);
};

function handleError(res, err) {
    return res.status(500).send(err);
}
