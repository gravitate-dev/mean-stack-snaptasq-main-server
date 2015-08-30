var _ = require('lodash');
var sms = require('../sms/sms.controller');
var format = require('string-format');
var Notify = require('./notify.model');
var moment = require('moment');
format.extend(String.prototype);
//sms.text('+15105858953','it works, but damn api calls.');
/**
Link
Message
Time
type
**/

/**
 * Notify Codes
 * Account(100-199), MyTask(200-299), ForTaskers(300-399), 
 * Chat(400-499), Friend(500-599), Community(600-699), Beta(700-799)
 **/

var NOTIFICODES = {
    'UNDEFINED': {
        msg: 'undefined',
        id: 0
    },
    'ACCOUNT_CREATE_NEW': {
        msg: 'Welcome to SnapTasq, {name}',
        id: 100
    },
    'ACCOUNT_VERIFY_EMAIL_SUCCESS': {
        msg: 'Your account is verified',
        id: 101
    },
    'ACCOUNT_VERIFY_PHONE_NUMBER_SUCCESS': {
        msg: 'Your number is verified',
        id: 102
    },
    'MYTASK_NEW_APPLICANT': {
        msg: '{tasker_name} has applied to your task {task}',
        id: 200,
        sms: true
    },
    'MYTASK_LEFT_APPLICANT': {
        msg: '{tasker_name} has left to your task. {task}',
        id: 201,
        sms: false
    },
    'MYTASK_FINISHED': {
        msg: '{tasker_name} has completed your task. {task}',
        id: 202,
        sms: true
    },
    'TASKER_UNASSIGNED': {
        msg: 'You are no longer a tasker for this task. {task}',
        id: 301
    },
    'TASKER_ASSIGNED': {
        msg: '{tasker_name} is chosen to help {task_owner_name} with task, {task}',
        id: 302
    },
    'CHAT_NEW_MESSAGE_RECV': {
        msg: 'New message from {sender_name}',
        id: 400
    },
    'CHAT_NEW_MESSAGE_RECV': {
        msg: 'Message sent to {recv_name}',
        id: 401
    },
    'FRIEND_NEW_REQUEST': {
        msg: 'New friend request from, {sender_name}',
        id: 500
    },
    'FRIEND_SENT_REQUEST': {
        msg: 'Sent friend request to, {recv_name}',
        id: 501
    },
    'GROUPS_CREATED_NEW': {
        msg: 'New Community {name} Created',
        id: 600
    },
    'GROUPS_CREATED_NEW': {
        msg: 'You have been accepted into the community, {name}',
        id: 601
    },
    'BETA_CODE_REGISTER_SUCCESS': {
        msg: 'Success. Welcome to the beta {name}.',
        id: 700
    }
};

function notify(toId, code, params, link) {
    if (NOTIFICODES[code] == undefined)
        throw new Error("Invalid error code " + code);
    var n = NOTIFICODES[code];
    var formatted = n.msg.format(params);

    var notifyObj = {
        to: toId,
        message: formatted,
        codeId: n.id,
        link: link
    };
    var newNotify = new Notify(notifyObj);
    newNotify.save(function(err, notify) {});
}

/**
 * Returns Notifications for the current user for this week
 **/
function getMyNotifications(req, res) {
    var today = moment().endOf('day');
    var lastWeek = moment(today).subtract(7, 'days');
    var currentUserId = req.session.userId;
    Notify.find({
        to: currentUserId,
        created: {
            $gte: lastWeek.toDate(),
            $lt: today.toDate()
        }
    }).sort({
        created: -1
    }).exec(function(err, notifications) {
        return res.json(200, notifications);
    });
}

module.exports = {
    put: notify,
    getMyNotifications: getMyNotifications
}
