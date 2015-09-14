var _ = require('lodash');
var sms = require('../sms/sms.controller');
var format = require('string-format');
var Notify = require('./notify.model');
var moment = require('moment');
var mongoose = require('mongoose');
format.extend(String.prototype);
//sms.text('+15105858953','it works, but damn api calls.');
/**
Link
Message
Time
type
**/
var hrefs = {
    user: "/user/view/",
    task: "/tasq/view/",
    community: "/community/view/",
};
var accountCodes = {};
var friendCodes = {
    newFriendRequest: {
        msg: '{name} would like to be your friend',
        href: hrefs.user,
        category: "friendRequest",
    },
    friendshipCreated: {
        msg: '{name} is now your friend',
        href: hrefs.user,
        category: "friend",
    },
    friendRequestHelp: {
        msg: '{name} is asking for you to help with {task}',
        href: hrefs.user,
        category: "friend",
    },
};
var taskOwnerCodes = {
    created: {
        msg: '{name} has created a task for {task}',
        href: hrefs.task,
        category: "taskOwner",
    },
    taskerQuit: {
        msg: '{name} has stopped helping you for {task}',
        href: hrefs.task,
        category: "taskOwner",
    },
    newApplicant: {
        msg: '{name} has applied to help you for {task}',
        href: hrefs.task,
        category: "taskOwner",
    },
    taskerStarted: {
        msg: '{name} has started helping you for {task}',
        href: hrefs.task,
        category: "taskOwner",
    },
    taskerFinished: {
        msg: '{name} has finished your task for {task}',
        href: hrefs.task,
        category: "taskOwner",
    },
};
var taskApplicantCodes = {
    created: {
        msg: 'You have applied to help {ownerName} with {task}',
        href: hrefs.task,
        category: "taskApplicant",
    },
    taskerChosen: {
        msg: '{ownerName} has picked {chosenName} to help for {task}',
        href: hrefs.task,
        category: "taskApplicant",
    },
    taskerCompleted: {
        msg: '{chosenName} has helped {ownerName} with {task}',
        href: hrefs.task,
        category: "taskApplicant",
    },
    taskerUnchosen: {
        msg: '{task} is now open again.',
        href: hrefs.task,
        category: "taskApplicant",
    },
};

var CODES = {
    account: accountCodes,
    friend: friendCodes,
    taskOwner: taskOwnerCodes,
    taskApplicant: taskApplicantCodes
};

function notify(data) {
    if (data == undefined) {
        return console.error("Empty data passed to notify");
    }
    var forOne = data.forOne || undefined;
    var forMany = data.forMany || [];
    var hrefId = data.hrefId;
    var codeObj = data.code;
    var params = data.params;
    if (codeObj == undefined || codeObj.msg == undefined) {
        return console.error("Passed in an invalid codeObj,", toOne, toMany, hrefId);
    }
    if (hrefId == undefined || typeof hrefId === 'string' || hrefId instanceof String) {
        return console.error("Missing hrefID or it is a normal string. Requires ObjectID.", hrefId, toOne, toMany);
    }
    var formatted = codeObj.msg.format(params);
    var href = codeObj.href + hrefId.toString();
    var category = codeObj.category;

    var notifyObj = {
        forOne: forOne,
        forMany: forMany,
        source: hrefId,
        href: href,
        message: formatted,
        category: category
    };
    var newNotify = new Notify(notifyObj);
    newNotify.save(function(err, notify) {
        if (err) console.error("Error saving notify", err);
    });
}

/**
 * Returns Notifications for the current user for this week
 **/
function getMyNotifications(req, res) {
    var category = req.param('category');
    var today = moment().endOf('day');
    var lastWeek = moment(today).subtract(7, 'days');
    var currentUserId = req.session.userId;

    var query = {
        forOne: currentUserId,
        created: {
            $gte: lastWeek.toDate(),
            $lt: today.toDate()
        }
    };
    if (category != undefined) {
        query.category = category;
    }
    Notify.find(category).sort({
        created: -1
    }).exec(function(err, notifications) {
        return res.json(200, notifications);
    });
}

module.exports = {
    put: notify,
    CODES: CODES,
    getMyNotifications: getMyNotifications
}
