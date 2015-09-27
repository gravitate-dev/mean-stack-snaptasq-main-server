var _ = require('lodash');
var sms = require('../sms/sms.controller');
var uuid = require('uuid');
var format = require('string-format');
var UserMessage = require('./userMessage.model').Message;
var UserMessageThread = require('./userMessage.model').Thread;
var User = require('../user/user.model');
var UserCtrl = require('../user/user.controller');
var moment = require('moment');
var mongoose = require('mongoose');
format.extend(String.prototype);
var RateLimiter = require('limiter').RateLimiter;
var limiterCreateMessage = new RateLimiter(10, 'minute', true);
var limiterRefreshInbox = new RateLimiter(120, 'minute', true);
var limiterReplyToMessage = new RateLimiter(20, 'minute', true);
var limiterGetMessagesByThreadId = new RateLimiter(20, 'minute', true);

var CONST_MAX_EMAILS_PER_PAGE = 30;
/**
 * Creates a new usermessage this is always created FROM the current user
 * new message will always be not a response
 * @ratelimit 5 per minute
 */
exports.create = function(req, res) {
    limiterCreateMessage.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.send(429, 'Too Many Requests - your IP is being rate limited. Please try again in one minute');
        } else {
            var toId = req.param('toId');
            if (toId == undefined) return res.send(400, "Missing parameter toId");
            var fromId = req.session.userId;
            var type = req.param('type'); // type is normal, friendRequest
            if (type == undefined) return res.send(400, "Missing parameter type to describe the type of message");

            var newObj = new UserMessage(req.body);
            if (type == "friendRequest") {
                newObj.title = "Friend Request";
            }
            var currentUserId = req.session.userId;
            User.findOne({
                _id: currentUserId
            }, function(err, me) {
                if (err) return res.send(500, err);
                if (!me) return res.send(404, "Could not find your user account");
                //i allow self replies
                if (type != "friendRequest") {
                    //if i am sending a nonfriend request to a nonfriend this is not allowed

                    //sometimes i get a string type othertimes i get MongooseObjectId
                    //this line below will deal with this.
                    if (toId != undefined) {
                        var temp = toId.toString();
                        if (temp != currentUserId) { //i am allowing replies to self.
                            if (!UserCtrl.isFriendsAlready(me, toId)) {
                                console.log("Message can only be sent to yourself, or a friend. You are neither.")
                                return res.send(403, "Unable to send message to user.");
                            }
                        }
                    }
                } else if (type == "friendRequest") {
                    //check if already friends if so then stop here.
                    if (UserCtrl.isFriendsAlready(me, toId)) {
                        return res.send(500, "You are already friends");
                    }
                }
                User.findOne({
                    _id: toId
                }, function(err, other) {
                    if (err) return res.send(500, err);
                    if (!other) return res.send(404, "Could not find target user");
                    newObj.to = {
                        id: other._id,
                        name: other.name,
                        pic: other.pic,
                        status: "unread"
                    };
                    newObj.from = {
                        id: me._id,
                        name: me.name,
                        pic: me.pic,
                        status: "sent"
                    };
                    _addMessageToThread(req, res, newObj, function(threadId) {
                        if (threadId == undefined) {
                            return res.status(500, "An error occured when creating your message");
                        }
                        newObj.threadId = threadId;
                        newObj.save(function(err, umsg) {
                            if (err) return validationError(res, err);
                            return res.json(umsg);
                        });
                    })
                });
            });
        }
    });
};

function _makeMessageThreadFromMessage(req, res, message, cb) {
    var thread = new UserMessageThread();
    thread.last = message.from;
    thread.title = message.title;
    thread.last.body = message.body;
    thread.type = message.type;
    if (thread.type == "friendRequest") {
        thread.viewerIds = [message.to.id];
        thread.ownerIds = [message.to.id];
    } else {
        thread.viewerIds = [message.from.id, message.to.id];
        thread.ownerIds = [message.from.id, message.to.id];
    }
    var m = {
        id: message._id,
        created: Date.now()
    }
    thread.messages = [m];
    thread.save(function(err, umsgt) {
        console.log(err);
        if (err) return validationError(res, err);
        return cb(umsgt._id);
    });
}
/**
 * This will add a message to a thread if it exists
 * it will also make sure that both viewerIds are on
 * IF there is no threadID on the message, it will assign one
 * Function will return a thread ID which can be used in creating
 * the usermessage object
 * @RESTRICTED: This function can not be called by any other function other than create
 * @return cb will return a threadID
 **/
function _addMessageToThread(req, res, message, cb) {
    var currentUserId = req.session.userId;
    if (message.threadId) {
        //reply to message
        UserMessageThread.findOne({
            _id: message.threadId
        }, function(err, umsgthread) {
            // check to see that i am part of the email thread
            var isMyThread = false;
            _.each(umsgthread.ownerIds, function(item) {
                if (item.equals(currentUserId))
                    isMyThread = true;
            });
            if (!isMyThread) {
                return res.send(403, "You can only reply to messages you are part of");
            }
            umsgthread.viewerIds = umsgthread.ownerIds;
            umsgthread.last = message.from;
            umsgthread.last.body = message.body;
            var m = {
                id: message._id,
                created: Date.now()
            }
            umsgthread.messages.push(m);
            umsgthread.save(function(err, umsgt) {
                if (err) return validationError(res, err);
                return cb(umsgt._id);
            });

        })
    } else {
        //new message
        _makeMessageThreadFromMessage(req, res, message, function(threadId) {
            return cb(threadId);
        });

    }
}
/**
 * This is used to verify the friend request. Used in user.controller
 **/
exports.isValidFriendRequest = function(req, res, messageId, fromUserId, toUserId, cb) {

    if (messageId == undefined) return res.send(400, "Missing parameter messageId");
    if (fromUserId == undefined) return res.send(400, "Missing parameter fromUserId");
    if (toUserId == undefined) return res.send(400, "Missing parameter toUserId");
    //to userId should be self
    if (req.session.userId != toUserId) {
        return res.send(500, "Only you can accept your own friend requests");
    }
    UserMessage.findOne({
        _id: messageId,
        'from.id': fromUserId,
        'to.id': toUserId,
        'type': 'friendRequest'
    }, function(err, umsg) {
        if (err) return res.send(500, err);
        if (!umsg) return res.send(404, "Message not found");
        //if there is a msg that means i am friend requested!
        return cb(true);
    });
}
exports.replyToMessage = function(req, res) {
    limiterReplyToMessage.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.send(429, "Too many replies. Please wait for 60 seconds then try again.");
        } else {
            var id = req.param('id');
            if (id == undefined) return res.send(400, "Missing parameter id");
            var reply = req.param('reply');
            if (reply == undefined || _.isEmpty(reply)) return res.send(400, "Can't send an empty response");

            //by having the $or clause i prevent people from reading messages they should not see
            var currentUserId = req.session.userId;
            UserMessage.findOne({
                _id: id,
                'to.id': currentUserId,
            }, function(err, umsg) {
                if (err) return res.send(500, err);
                if (!umsg) return res.send(404, "Message not found");
                var replyMsg = new UserMessage(umsg);
                replyMsg.body = reply;
                replyMsg._id = mongoose.Types.ObjectId();
                replyMsg.isNew = true; //<--------------------IMPORTANT

                //i swap the from and to in this case
                replyMsg.from = umsg.to;
                replyMsg.to = umsg.from;
                replyMsg.to.status = "unread";
                replyMsg.from.status = "sent";
                _addMessageToThread(req, res, replyMsg, function(threadId) {
                    if (threadId == undefined) {
                        return res.status(500, "An error occured when creating your message");
                    }
                    replyMsg.threadId = threadId;
                    replyMsg.save(function(err, umsg) {
                        if (err) return validationError(res, err);
                        return res.status(200).json(umsg);
                    });
                })
            });
        }
    });
}

exports.hideMessageThread = function(req, res) {
    var id = req.param('id');
    var t = req.userThread;
    var currentUserId = req.session.userId;
    var removeMe = -1;
    for (var i = 0; i < t.viewerIds.length; i++) {
        if (t.viewerIds[i].equals(currentUserId)) {
            var removeMe = i;
        }
    }
    t.viewerIds = _.filter(t.viewerIds, function(item) {
        return !item.equals(currentUserId);
    });
    t.save(function(err, umsgthread) {
        if (err) return validationError(res, err);
        return res.send(200, "Conversation Hidden");
    });
}
exports.doesUserOwnAndSeeMessageThread = function(req, res, next) {
    var id = req.param('id');
    var currentUserId = req.session.userId;
    if (id == undefined) return res.send(400, "Missing parameter id for threadId");
    UserMessageThread.findOne({
        _id: id
    }, function(err, umsgthread) {
        if (err) return validationError(res, err);
        if (!umsgthread) return res.send(404, "Message thread is deleted"); //system deletions
        // check to see that i am part of the email thread and have not deleted it.
        var isVisibleToMe = false;
        _.each(umsgthread.viewerIds, function(item) {
            if (item.equals(currentUserId))
                isVisibleToMe = true;
        });
        if (!isVisibleToMe) {
            return res.send(403, "Can not view deleted messages.");
        }
        console.log("Found the thread");
        req.userThread = umsgthread;
        return next();
    });
}
exports.getMessagesByThreadId = function(req, res) {
    // call doesUserOwnAndSeeMessageThread before this
    console.log(req.userThread);
    var threadId = req.param('id');
    limiterGetMessagesByThreadId.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.send(429, "Slow down. Too many requests.");
        } else {
            var currentUserId = req.session.userId;
            UserMessage.find({
                    'threadId': threadId
                }).sort({
                    created: -1
                })
                .exec(function(err, umsgs) {
                    return res.status(200).json(umsgs);
                });
        }
    });
}

exports.replyToThread = function(req, res, next) {
    console.log("reply to thread");
    var msg = req.param('reply');
    var userThread = req.userThread;
    req.body = {
        title: req.userThread.title,
        body: msg,
        type: "normal",
        threadId: req.userThread._id
    }
    req.params.toId = req.userThread.last.id;
    req.params.type = "normal"
    return exports.create(req, res);
}

exports.getMessageThreadById = function(req, res) {
    //essentially just call  doesUserOwnAndSeeMessageThread then return this
    return res.status(200).json(req.userThread);

}
exports.getMyMessagesFriendRequests = function(req, res) {
    limiterRefreshInbox.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.send(429, "Inbox already updated");
        } else {
            var offset = req.param('offset');
            var limit = req.param('limit');
            if (limit == undefined || limit > CONST_MAX_EMAILS_PER_PAGE) return res.send(400, "Limit cannot exceed max or is missing");
            if (offset == undefined) return res.send(400, "Offset is missing");
            var currentUserId = req.session.userId;
            UserMessageThread.find({
                    viewerIds: currentUserId,
                    type: {
                        $eq: "friendRequest"
                    }
                }).sort({
                    created: -1
                })
                .exec(function(err, umsgsthreads) {
                    return res.status(200).json(umsgsthreads);
                });
        }
    });
}
exports.getMyMessagesPrimary = function(req, res) {
    limiterRefreshInbox.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.send(429, "Inbox already updated");
        } else {
            var offset = req.param('offset');
            var limit = req.param('limit');
            if (limit == undefined || limit > CONST_MAX_EMAILS_PER_PAGE) return res.send(400, "Limit cannot exceed max or is missing");
            if (offset == undefined) return res.send(400, "Offset is missing");
            var currentUserId = req.session.userId;
            UserMessageThread.find({
                    viewerIds: currentUserId,
                    type: {
                        $ne: "friendRequest"
                    }
                }).sort({
                    created: -1
                })
                .exec(function(err, umsgsthreads) {
                    return res.status(200).json(umsgsthreads);
                });
        }
    });
}


//this is done when a friend request is accepted
//thats why to.id will always be to the currentUserId
exports.deleteThreadIdInternalFromMessageId = function(req, res, messageId, cb) {
    var currentUserId = req.session.userId;
    if (messageId == undefined) return res.send(400, "Missing parameter messageId");
    UserMessage.findOne({
        'to.id': currentUserId, //this makes sure i am the owner
        _id: messageId
    }, function(err, umsg) {
        UserMessageThread.findOneAndRemove({
            _id: umsg.threadId,
            type: "friendRequest"
        }, function(err, umsgthread) {
            if (err) return validationError(res, err);
            if (!umsgthread) return res.send(404, "Thread could not be found with this message");
            return cb(true);
        });

    });
}
exports.deleteMessageIdInternal = function(req, res, id, cb) {
    var currentUserId = req.session.userId;
    if (id == undefined) return res.send(400, "Missing parameter id");
    UserMessage.findOneAndRemove({
        'to.id': currentUserId, //this makes sure i am the owner
        _id: id
    }, function(err) {
        return cb(true);
    });
}
exports.deleteById = function(req, res) {
    var currentUserId = req.session.userId;
    var id = req.param('id');
    if (id == undefined) return res.send(400, "Missing parameter id");
    UserMessage.findOneAndRemove({
        'to.id': currentUserId, //this makes sure i am the owner
        _id: id
    }, function(err) {
        if (err) return validationError(res, err);
        return res.send(200, "Message has been deleted");
    });
}

exports.getMessageById = function(req, res) {
    var id = req.param('id');
    if (id == undefined) return res.send(400, "Missing parameter id");
    //by having the $or clause i prevent people from reading messages they should not see
    var currentUserId = req.session.userId;
    UserMessage.findOne({
        _id: id,
        $or: [{
            'to.id': currentUserId
        }, {
            'from.id': currentUserId
        }],
    }, function(err, umsg) {
        if (err) return res.send(500, err);
        if (!umsg) return res.send(404, "Message not found");
        return res.status(200).json(umsg);
    });
}

var validationError = function(res, err) {
    return res.json(422, err);
};
