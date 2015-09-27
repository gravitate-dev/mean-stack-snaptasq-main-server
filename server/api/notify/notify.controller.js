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
        // one target friend
        // many = [];
        msgOne: '{name} would like to be your friend',
        href: hrefs.user,
        category: "friendRequest",
        code: "friend.request"
    },
    friendshipCreated: {
        // one target friend
        // many = [];
        msgOne: '{name} is now your friend',
        href: hrefs.user,
        category: "friend",
        code: "friend.create"
    },
    friendRequestHelp: {
        msgOne: '{name} is asking for you to help with {task}',
        href: hrefs.user,
        category: "friend",
        code: "friend.help.task"
    },
};
var taskOwnerCodes = {
    created: {

        // One me owner
        // many myFriends
        msgOne: 'You created a tasq for {task}',
        msg: '{name} created a tasq for {task}',
        href: hrefs.task,
        category: "taskOwner",
        code: "task.owner.created.task"
    },
    taskerQuit: {
        // One me owner
        // many []
        msgOne: '{name} stopped helping you for {task}',
        href: hrefs.task,
        category: "taskOwner",
        code: "task.owner.tasker.quit"
    },
    newApplicant: {
        // One me owner
        // many []
        msgOne: '{name} applied to help you for {task}',
        href: hrefs.task,
        category: "taskOwner",
        code: "task.owner.applicant.created"
    },
    taskerStarted: {
        // One me owner
        // many []
        msgOne: '{name} started helping you for {task}',
        href: hrefs.task,
        category: "taskOwner",
        code: "task.owner.tasker.started"
    },
    taskerFinished: {
        // One me owner
        // many []
        msgOne: '{name} finished your tasq for {task}',
        href: hrefs.task,
        category: "taskOwner",
        code: "task.owner.tasker.finished"
    },
};
var taskApplicantCodes = {
    created: {
        // one = chosen tasker
        // many = []
        msgOne: 'You applied to help {ownerName} with {task}',
        href: hrefs.task,
        category: "taskApplicant",
        code: "task.applicant.created"
    },
    taskerChosen: {
        // one = chosen tasker
        // many = applicants minus me
        msgOne: '{ownerName} picked you to help with {task}',
        msg: '{ownerName} picked {chosenName} to help with {task}',
        href: hrefs.task,
        category: "taskApplicant",
        code: "task.applicant.created"
    },
    taskerCompleted: {
        // one = chosen tasker
        // many = applicants minus me
        msgOne: 'You helped {ownerName} with {task}',
        msg: '{chosenName} helped {ownerName} with {task}',
        href: hrefs.task,
        category: "taskApplicant",
        code: "task.applicant.task.completed"
    },
    taskerUnchosen: {
        // one = chosen tasker
        // many = applicants minus me
        msgOne: '{ownerName} unchose you to help with {task}',
        msg: '{task} is now open again.',
        href: hrefs.task,
        category: "taskApplicant",
        code: "task.applicant.unchosen"
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
    if (codeObj == undefined) {
        console.error("Passed in an invalid codeObj,", forOne, forMany, hrefId);
        var stack = new Error().stack;
        return console.log(stack);
    }
    if (hrefId == undefined || typeof hrefId === 'string' || hrefId instanceof String) {
        console.error("Missing hrefID or it is a normal string. Requires ObjectID.", hrefId, forOne, forMany);
        var stack = new Error().stack;
        return console.log(stack);
    }
    var formattedForMany = undefined;
    var formattedForOne = undefined;
    if (codeObj.msg != undefined) {
        formattedForMany = codeObj.msg.format(params);
    }
    if (codeObj.msgOne != undefined) {
        formattedForOne = codeObj.msgOne.format(params);
    }
    var notifyObj = {
        forOne: forOne,
        forMany: forMany,
        source: hrefId,
        message: formattedForMany,
        messageOne: formattedForOne,
        href: codeObj.href + hrefId.toString(),
        category: codeObj.category,
        code: codeObj.code
    };
    if (data.pic != undefined) {
        notifyObj.pic = data.pic;
    }
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
    //SomeObjects.find({$or : [{a: 3}, {b: 4}]});
    //{ $or: [ { quantity: { $lt: 20 } }, { price: 10 } ] }
    var query = {
        $or: [{
            forOne: currentUserId
        }, {
            forMany: currentUserId
        }],
        created: {
            $gte: lastWeek.toDate(),
            $lt: today.toDate()
        }
    };
    if (category != undefined) {
        query.category = category;
    }
    Notify.find(query).sort({
        created: -1
    }).exec(function(err, notifications) {
        return res.status(200).json(notifications);
    });
}

function hideById(req, res) {
    var id = req.param('id');
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.send(401, "Please login again");
    if (id == undefined) return res.send(400, "Missing parameter id. The notification id you want to remove.");

    var query = {
        _id: id
    };
    var operation = {
        $pull: {
            'forMany': {
                id: currentUserId
            }
        }
    };
    var opts = {};
    /* There are two places where the notification will show to me.
     * It will show it to my ID in forOne and forMany. I will remove me from both.
     **/
    Notify.update(query, operation, opts, function(err) {
        Notify.findOne({
            _id: id,
            forOne: currentUserId
        }, function(err, doc) {
            if (doc) {
                doc.forOne = undefined;
                doc.save();
            }
            return res.send(200, "Success");
        });
    });
}

function removeNotification(query) {
    Notify.find(query).remove().exec();
}

module.exports = {
    remove: removeNotification,
    put: notify,
    CODES: CODES,
    getMyNotifications: getMyNotifications,
    hideById: hideById
}
