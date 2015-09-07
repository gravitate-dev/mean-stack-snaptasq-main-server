var _ = require('lodash');
var sms = require('../sms/sms.controller');
var uuid = require('uuid');
var format = require('string-format');
var UserMessage = require('./userMessage.model');
var User = require('../user/user.model');
var moment = require('moment');
var mongoose = require('mongoose');
format.extend(String.prototype);
var RateLimiter = require('limiter').RateLimiter;
var limiterCreateMessage = new RateLimiter(10, 'minute', true);
var limiterRefreshInbox = new RateLimiter(60, 'minute', true);
var limiterReplyToMessage = new RateLimiter(20, 'minute', true);

var CONST_MAX_EMAILS_PER_PAGE = 30;
/**
 * Creates a new usermessage this is always created FROM the current user
 * @ratelimit 5 per minute
 */
exports.create = function(req, res) {
    limiterCreateMessage.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            res.writeHead(429, {
                'Content-Type': 'text/plain;charset=UTF-8'
            });
            return res.end('Too Many Requests - your IP is being rate limited. Please try again in one minute');
        } else {
            var toId = req.param('toId');
            if (toId == undefined) return res.send(400, "Missing parameter toId");
            var fromId = req.session.userId;
            var type = req.param('type'); // type is normal, friendRequest
            if (type == undefined) return res.send(400, "Missing parameter type to describe the type of message");

            var newObj = new UserMessage(req.body);
            if (newObj.threadId == undefined) {
                newObj.threadId = uuid.v4();
            }
            if (type == "friendRequest") {
                newObj.title = "Friend Request";
            }
            User.findOne({
                _id: req.session.userId
            }, function(err, me) {
                if (err) return res.send(500, err);
                if (!me) return res.send(404, "Could not find your user account");
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
                    newObj.save(function(err, umsg) {
                        if (err) return validationError(res, err);
                        return res.json(umsg);
                    });
                });
            });
        }
    });
};

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
                replyMsg.save(function(err, rmsg) {
                    if (err) return validationError(res, err);
                    return res.json(200, rmsg);
                });
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
            UserMessage.find({
                    $or: [{
                        'to.id': currentUserId
                    }, {
                        'from.id': currentUserId
                    }],
                    type: {
                        $ne: "friendRequest"
                    }
                }).sort({
                    created: -1
                })
                .limit(limit)
                .skip(offset * limit)
                .exec(function(err, umsgs) {
                    return res.json(200, umsgs);
                });
        }
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
            UserMessage.find({
                    $or: [{
                        'to.id': currentUserId
                    }, {
                        'from.id': currentUserId
                    }],
                    type: "friendRequest"
                }).sort({
                    created: -1
                })
                .limit(limit)
                .skip(offset * limit)
                .exec(function(err, umsgs) {
                    return res.json(200, umsgs);
                });
        }
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
        return res.json(200, umsg);
    });
}

var validationError = function(res, err) {
    return res.json(422, err);
};
