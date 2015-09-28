'use strict';
var Notify = require('../notify/notify.controller');
var Emailer = require('../email/email.controller');
var User = require('../user/user.model');
var UserMessageCtrl = require('../userMessage/userMessage.controller');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var uuid = require('uuid');
var graph = require('fbgraph');
var sha1 = require('sha1');
var Beta = require('../beta/beta.controller');
var _ = require('lodash');
var mongoose = require('mongoose');
var sms = require('../sms/sms.controller');
var RateLimiter = require('limiter').RateLimiter;
// Allow 150 requests per hour (the Twitter search limit). Also understands 
// 'second', 'minute', 'day', or a number of milliseconds 
var limiterVerifyPhoneNumber = new RateLimiter(3, 'hour', true);
var limiterRedeemVerifyPhoneNumber = new RateLimiter(10, 'hour', true);
var validationError = function(res, err) {
    return res.status(422).json(err);
};


var SCHEMA_USER_HIDE_FROM_ME_CREATE = '-salt -hashedPassword -forgotPassCode -phone.verifyCode -phone.attempts';
var SCHEMA_USER_HIDE_FROM_ME = '-salt -hashedPassword -verification.code -forgotPassCode -phone.verifyCode -phone.attempts';
var SCHEMA_USER_HIDE_FROM_OTHERS = '-salt -hashedPassword -verification.code -forgotPassCode -phone.verifyCode -phone.number -phone.newNumber -personalBetaCodes -doNotAutoFriend';
/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
    User.find({}, '-salt -hashedPassword -verification.code -forgotPassCode -personalBetaCodes', function(err, users) {
        if (err) return res.status(500).send(err);
        res.status(200).json(users);
    });
};
/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
    var newUser = new User(req.body);
    //name is already set!
    newUser.accountName = newUser.name;
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.verification = {
        code: uuid.v4(),
        status: false
    };
    newUser.forgotPassCode = uuid.v4();
    newUser.requiresBeta = config.betaTrails;
    if (config.dontRequireEmailVerification) {
        newUser.verification.status = true;
    }
    newUser.save(function(err, user) {
        if (err) return validationError(res, err);
        var token = jwt.sign({
            _id: user._id
        }, config.secrets.session, {
            expiresInMinutes: 60 * 5
        });
        req.session.userId = user._id;
        req.session.save();
        //(toId,code,params,link,cb)
        User.findById(user._id, SCHEMA_USER_HIDE_FROM_ME_CREATE, function(err, user) {
            if (err || user == null) {
                return res.status(500).json({
                    status: "error",
                    message: "We Couldn't find your account."
                });
                return;
            }
            if (user.verification.status == false) {
                console.log("Sending verification code", user.verification.code);
                Emailer.sendVerificationSilent(user.email, user.verification.code);
            }
            delete user.verification.code;
            res.json({
                token: token,
                user: user
            });
        });
    });
};
exports.getFbAccessToken = function(req, res, next) {
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    User.findOne({
        _id: currentUserId
    }, SCHEMA_USER_HIDE_FROM_ME, function(err, user) {
        if (err) validationError(res, err);
        if (!user) return res.status(403).send("Please login again");
        if (!user.fb) return res.status(403).send("You are not connected with facebook");
        req.token = user.fb.accessToken;
        next();
    });
}

function isValidPhoneNumber(inputtxt) {
    if (inputtxt == undefined) {
        return false;
    }
    var phoneno = /^[0-9]{10}$/;
    if (inputtxt.match(phoneno)) {
        return true;
    } else {
        return false;
    }
}
/**
 * Sends a verification text message to the user.
 * The user will then respond with the 4 alphanumeric code on the website
 * in their settings page. I keep track of the # of attempts of this api call
 *
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.sendVerificationText = function(req, res) {
        // I dont rate limit when you are not logged in.
        var currentUserId = req.session.userId;
        if (currentUserId == undefined) return res.status(401).send("Please login again");
        limiterVerifyPhoneNumber.removeTokens(1, function(err, remainingRequests) {
            console.log(remainingRequests);
            if (remainingRequests < 0) {
                return res.status(429).send('Too many requests, try again in an hour or contact support for additional help');
            } else {
                var currentUserId = req.session.userId;
                if (currentUserId == undefined) return res.status(401).send("Please login again");
                var number = req.param('number');
                if (number == undefined || !isValidPhoneNumber(number)) return res.status(400).send("Invalid phone number");
                User.findOne({
                    _id: currentUserId
                }, function(err, user) {
                    if (err) validationError(res, err);
                    if (!user) return res.status(401).send("Please login again");
                    var notVerifiedYet = false;
                    var isChangingNumber = false;
                    if (user.phone == undefined) {
                        notVerifiedYet = true;
                    } else {
                        // it will be undefined if its not set
                        // else the number will be different if i am changing
                        if (user.phone.number == undefined) {
                            notVerifiedYet = true;
                        } else if (user.phone.number != number) {
                            notVerifiedYet = true;
                        }
                    }
                    var phoneVerifyCode = uuid.v4().substr(0, 4);
                    // @removeable-begin - after 10/10/2015
                    // reason: schema change
                    if (user.phone == undefined) {
                        user.phone = {
                            verified: false,
                            attempts: 0
                        };
                    }
                    // @removeable-end
                    if (notVerifiedYet) {
                        user.phone.newNumber = number;
                        user.phone.verifyCode = phoneVerifyCode;
                        user.phone.attempts++;
                        user.save(function(err) {
                            if (err) return validationError(res, err);
                            sms.text(number, phoneVerifyCode + " is your verification code. Please enter this in your account settings. You can always turn off text notifications in your account settings as well. Enjoy, snaptasq.")
                            return res.status(200).send("Verification text sent to your phone. Please enter this code.")
                        });
                    } else {
                        return res.status(500).send("Phone number already verified");
                    }
                });
            }
        });
    }
    /**
     * User will attempt to verify their phone code
     *
     * @limit 3 calls per hour
     */
exports.redeemPhoneVerifyCode = function(req, res) {
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    var code = req.param('code');
    if (code == undefined) return res.status(400).send("Missing code. The code to verify your phone number");
    limiterRedeemVerifyPhoneNumber.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.status(429).send('Too many requests, try again in an hour');
        } else {
            User.findOne({
                _id: currentUserId
            }, function(err, user) {
                if (err) validationError(res, err);
                if (!user) return res.status(401).send("Please login again");
                console.log(JSON.stringify(user.phone));
                var doesCodeMatch = (user.phone.verifyCode != undefined && user.phone.verifyCode == code);
                if (doesCodeMatch) {
                    user.phone.number = user.phone.newNumber;
                    user.phone.newNumber = undefined;
                    user.phone.verified = true;
                    user.phone.verifyCode = uuid.v4().substring(0, 4);
                    user.save(function(err) {
                        if (err) return validationError(res, err);
                        return res.status(200).send("Your phone number is now verified");
                    });
                } else {
                    return res.status(403).send("You have entered an incorrect code");
                }
            });
        }
    });
};
exports.hasFbPermissionInternalByUserObject = function(user, permission, cb) {
    if (!user) return cb(false);
    if (!user.fb) return cb(false);
    graph.get('/' + user.fb.id + '/permissions', {
        access_token: user.fb.accessToken
    }, function(err, response) {
        if (err) {
            cb(false);
        }
        //user.fb.permissions = [];
        var hasPermission = false;
        if (!response) return cb(false);
        if (!response.data) return cb(false);
        for (var i = 0; i < response.data.length; i++) {
            var item = response.data[i];
            if (item.status == "granted" && item.permission == permission) {
                return cb(true);
            }
        }
        return cb(false);
    });
}
exports.hasFbPermissionInternal = function(req, permission, cb) {
    User.findOne({
        _id: req.session.userId
    }, function(err, user) {
        if (err) validationError(res, err);
        if (!user) return cb(false);
        if (!user.fb) return cb(false);
        graph.get('/' + user.fb.id + '/permissions', {
            access_token: user.fb.accessToken
        }, function(err, response) {
            if (err) {
                cb(false);
            }
            //user.fb.permissions = [];
            var hasPermission = false;
            if (!response) return cb(false);
            if (!response.data) return cb(false);
            for (var i = 0; i < response.data.length; i++) {
                var item = response.data[i];
                if (item.status == "granted" && item.permission == permission) {
                    return cb(true);
                }
            }
            return cb(false);
        });
    });
}
exports.hasFbPermission = function(req, res) {
    if (req.param('permission') == undefined) {
        return res.status(400).send("Missing parameter req.permission");
    }
    var permission = req.param('permission');
    User.findOne({
        _id: req.session.userId
    }, function(err, user) {
        if (err) validationError(res, err);
        if (!user) return res.status(403).send("Please login again");
        if (!user.fb) return res.status(500).send("You are not connected with facebook");
        /** if facebook starts bitching about API call rates turn this baby on **/
        /*if (user.fb.permissions){
            for (var i = 0; i < user.fb.permissions.length;i++){
                if (user.fb.permissions[i]==permission){
                    return res.status(200).send("Permissions granted already");
                }
            }
        }*/
        graph.get('/' + user.fb.id + '/permissions', {
            access_token: user.fb.accessToken
        }, function(err, response) {
            if (err) {
                return res.status(500).send("Error with getting /permissions from user " + user._id.toString());
            }
            //user.fb.permissions = [];
            var hasPermission = false;
            if (!response) return res.status(500).send("no response");
            if (!response.data) return res.status(500).send("bad response");
            for (var i = 0; i < response.data.length; i++) {
                var item = response.data[i];
                if (item.status == "granted" && item.permission == permission) {
                    return res.status(200).send("Facebook permission exists");
                }
            }
            return res.status(500).send("Facebook permission not there");
        });
    });
};
/**
 * Applies a beta code
 * This gets req.beta from beta.isValidCode
 */
exports.applyBetaCode = function(req, res, next) {
        var currentUserId = req.session.userId;
        if (currentUserId == undefined) {
            return res.send(401); //they need to relogin
        }
        User.findOne({
            _id: currentUserId
        }, function(err, user) {
            if (err) validationError(res, err);
            if (!user) return res.status(401).send("Please login again");
            if (!user.requiresBeta) return res.status(400).send("Success, you have already entered a beta code!");
            user.requiresBeta = false;
            if (req.beta.isCodeRoot) {
                //generate two more beta codes then save them to the user object
                user.personalBetaCodes.push(Beta.generatePersonalInviteCode(user));
                user.personalBetaCodes.push(Beta.generatePersonalInviteCode(user));
            }
            user.save(function(err) {
                if (err) return validationError(res, err);
                return next();
            });
        });
    }
    /**
     * Can be triggered by either user.
     * This will unfriend both sides.
     * This will NOT block the users
     * This will add the user to User.doNotAutoFriend
     **/
exports.removeFriendship = function(req, res) {
        var currentUserId = req.session.userId;
        var friendId = req.param('id');
        if (friendId == undefined) return res.status(400).send("Missing parameter, id. The friends user id");
        if (mongoose.Types.ObjectId.isValid(friendId) == false) return res.status(400).send("Invalid friend ID");
        if (currentUserId == undefined) {
            return res.status(401).send("Please login first"); //they need to relogin
        }
        User.findById(currentUserId, function(err, user) {
            if (err) validationError(res, err);
            if (!user) return res.status(401).send("Please login first");
            if (!_isFriendsAlready(user, friendId)) {
                return res.status(500).send("You are already not friends");
            }
            _removeFriends(req, res, friendId, currentUserId, function(wasSuccess) {
                if (wasSuccess) return res.status(200).send("You are no longer friends.");
                else return res.status(500).send("An error occured.");
            });
        });
    }
    /** 
     * This function is called by both users
     * Once for a request, Will you be my friend?
     * Once for a user saying Yes, i will be your friend.
     **/
exports.requestFriendship = function(req, res) {
    var currentUserId = req.session.userId;
    var friendId = req.param('id');
    if (friendId == undefined) return res.status(400).send("Missing parameter, id. The friends user id");
    if (currentUserId == undefined) {
        return res.status(401).send("Please login first"); //they need to relogin
    }
    User.findOne({
        _id: currentUserId
    }, function(err, user) {
        if (err) validationError(res, err);
        if (!user) return res.status(401).send("Please login first");
        if (_isFriendsAlready(user, friendId)) {
            return res.status(200).send("You are already friends");
        }
        //check the callers canFriends. If they can friend then make a friendship
        var isCompletingFriendship = false;
        for (var i = 0; i < user.canFriend.length; i++) {
            if (user.canFriend[i].equals(friendId)) {
                isCompletingFriendship = true;
                break;
            }
        }
        if (isCompletingFriendship) {
            _makeFriends(req, res, friendId, currentUserId, function(wasSuccess) {
                if (wasSuccess) {
                    User.findById(friendId, function(err, frnd) {
                        if (err) return validationError(res, err);
                        if (!frnd) return res.status(404).send("Friend not found.");
                        // Notify friend, that i have am your friend
                        Notify.put({
                            forOne: friendId,
                            forMany: [],
                            hrefId: user._id,
                            code: Notify.CODES.friend.friendshipCreated,
                            params: {
                                name: user.name
                            }
                        });
                        // Notify me, that i have a new friend
                        Notify.put({
                            forOne: user._id,
                            forMany: [],
                            hrefId: frnd._id,
                            code: Notify.CODES.friend.friendshipCreated,
                            params: {
                                name: frnd.name
                            }
                        });
                        //also remove the friend request
                        Notify.remove({
                            "code": "friend.request",
                            "forOne": user._id,
                            "source": frnd._id
                        });
                        Notify.remove({
                            "code": "friend.request",
                            "forOne": friendId,
                            "source": user._id
                        });
                        return res.status(200).send("You are now friends.");
                    });
                    // Notify friend, that i am your friend
                } else return res.status(500).send("An error occured.");
            });
        } else {
            //send a friend request to the other user
            //check to make sure Friend already hasnt  received a request
            User.findById(friendId, function(err, frnd) {
                if (err) {
                    return validationError(res, err);
                }
                if (!frnd) return res.status(404).send("User does not exist anymore");
                // check for duplicate friend requests
                for (var i = 0; i < frnd.canFriend.length; i++) {
                    if (frnd.canFriend[i].equals(user._id)) {
                        return res.status(500).send("You have already sent a friend request to this person");
                    }
                }
                // if no duplicates then proceed
                var addCurrentUserId = {
                    $addToSet: {
                        canFriend: user._id
                    }
                };
                User.findByIdAndUpdate(friendId, addCurrentUserId, function(err, friend) {
                    if (err) {
                        return validationError(res, err);
                    }
                    Notify.put({
                        forOne: friend._id,
                        forMany: [],
                        hrefId: user._id,
                        pic: user.pic,
                        code: Notify.CODES.friend.newFriendRequest,
                        params: {
                            name: user.name
                        }
                    });
                    return res.status(200).send("Friend request has been sent");
                });
            });
        }
    });
}

function _friendObjectFromUser(friend) {
    return {
        id: friend._id,
        name: friend.name,
        externalId: friend.fb.id,
        pic: friend.pic,
        source: "snaptasq"
    }
}
exports.isFriendsAlready = function(user, friendId) {
    return _isFriendsAlready(user, friendId);
}

function _isFriendsAlready(user, friendId) {
    if (user.friends == undefined) return false;
    for (var i = 0; i < user.friends.length; i++) {
        if (user.friends[i].id.equals(friendId)) return true;
    }
    return false;
}

function _makeFriends(req, res, idOther, idMe, cb) {
    if (idMe == undefined) return res.status(400).send("Me id, can not be undefined in _makeFriends");
    if (idOther == undefined) return res.status(400).send("Other id, can not be undefined in _makeFriends");
    //this can only be called by addFriendToMe
    if (idMe != req.session.userId) {
        return res.status(403).send("Only you can add friends to yourself");
    }
    User.findOne({
        _id: idOther
    }, '-salt -hashedPassword -verification.code -forgotPassCode', function(err, other) { // don't ever give out the password or salt
        if (err) return res.status(500).send(err);
        if (!other) return res.status(404).send("This user no longer exists");
        User.findOne({
            _id: idMe
        }, '-salt -hashedPassword -verification.code -forgotPassCode', function(err, me) { // don't ever give out the password or salt
            if (err) return res.status(500).send(err);
            if (!me) return res.status(404).send("Your account no longer exists"); //strange but logical
            //now check if i am already their friend
            var needToSaveOther = false;
            if (!_isFriendsAlready(me, other._id)) {
                // i should not have them not auto friend if they are now friends.
                // its kinda meaningless, but i do it here just because it wont hurt either.
                for (var i = 0; i < me.doNotAutoFriend.length; i++) {
                    if (me.doNotAutoFriend[i].equals(other._id)) {
                        me.doNotAutoFriend.splice(i, 1);
                        break;
                    }
                }
                me.friends.push(_friendObjectFromUser(other));
            }
            if (!_isFriendsAlready(other, me._id)) {
                other.friends.push(_friendObjectFromUser(me));
                // i should not have them not auto friend if they are now friends.
                // its kinda meaningless, but i do it here just because it wont hurt either.
                for (var i = 0; i < other.doNotAutoFriend.length; i++) {
                    if (other.doNotAutoFriend[i].equals(me._id)) {
                        other.doNotAutoFriend.splice(i, 1);
                        break;
                    }
                }
                needToSaveOther = true;
            }
            if (needToSaveOther) {
                console.error("Suspicious one sided friendship");
            }
            // lets remove the canFriend too
            me.canFriend = _.filter(me.canFriend, function(item) {
                return !item.equals(idOther);
            });
            other.canFriend = _.filter(other.canFriend, function(item) {
                return !item.equals(idMe);
            });
            me.save(function(err) {
                if (err) return validationError(res, err);
                other.save(function(err) {
                    if (err) return validationError(res, err);
                    return cb(true);
                });
            });
        });
    });
}
/**
 * This will unfriend each other
 **/
function _removeFriends(req, res, idOther, idMe, cb) {
    if (idMe == undefined) return res.status(400).send("Me id, can not be undefined in _makeFriends");
    if (idOther == undefined) return res.status(400).send("Other id, can not be undefined in _makeFriends");
    //this can only be called by addFriendToMe
    if (idMe != req.session.userId) {
        return res.status(403).send("Only you can remove your own friends");
    }
    User.findOne({
        _id: idOther
    }, '-salt -hashedPassword -verification.code -forgotPassCode', function(err, other) { // don't ever give out the password or salt
        if (err) return res.status(500).send(err);
        //if the other peson doesnt exist it should be fine to unfriend anyways
        User.findOne({
            _id: idMe
        }, '-salt -hashedPassword -verification.code -forgotPassCode', function(err, me) { // don't ever give out the password or salt
            if (err) return res.status(500).send(err);
            if (!me) return res.status(404).send("Your account no longer exists"); //strange but logical
            // lets remove the canFriend too
            me.canFriend = _.filter(me.canFriend, function(item) {
                return !item.equals(idOther);
            });
            me.friends = _.filter(me.friends, function(item) {
                return !item.id.equals(idOther);
            });
            var needsDontAutoFriend = true;
            for (var i = 0; i < me.doNotAutoFriend.length; i++) {
                if (me.doNotAutoFriend[i].equals(other._id)) {
                    needsDontAutoFriend = false;
                    break;
                }
            }
            if (needsDontAutoFriend) {
                me.doNotAutoFriend.push(other._id);
            }
            me.save(function(err) {
                if (err) return validationError(res, err);
                if (other) {
                    other.canFriend = _.filter(other.canFriend, function(item) {
                        return !item.equals(idMe);
                    });
                    other.friends = _.filter(other.friends, function(item) {
                        return !item.id.equals(idMe);
                    });
                    var needsDontAutoFriend = true;
                    for (var i = 0; i < other.doNotAutoFriend.length; i++) {
                        if (other.doNotAutoFriend[i].equals(me._id)) {
                            needsDontAutoFriend = false;
                            break;
                        }
                    }
                    if (needsDontAutoFriend) {
                        other.doNotAutoFriend.push(me._id);
                    }
                    other.save(function(err) {
                        if (err) return validationError(res, err);
                        return cb(true);
                    });
                } else {
                    return cb(true);
                }
            });
        });
    });
}
/**
 * Get a single user
 */
exports.show = function(req, res, next) {
    var userId = req.param('id');
    if (userId == undefined) {
        return res.status(400).send("Missing parameter id");
    }
    User.findById(userId, SCHEMA_USER_HIDE_FROM_OTHERS, function(err, user) {
        if (err) return next(err);
        if (!user) return res.send(401);
        res.json(user);
    });
};
/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
    User.findByIdAndRemove(req.params.id, function(err, user) {
        if (err) return res.status(500).send(err);
        return res.send(204);
    });
};
/**
 * Deletes yourself via the session id
 * restriction: 'loggedin'
 * When doing a delete self, i should remove myself from all tasks, that are
 * related to me.
 //there is alot of things that should happen
// Remove All Community references to this user
// Remove All TASK references from this user
// Remove ALL TASKS applied from this user
// Remove ALL FRIENDS of this user
// Remove ALL FRIEND requests too
*/
exports.deleteMyAccount = function(req, res) {
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) {
        return res.status(500).send("Missing session userId");
    }
    if (req.param('id') != currentUserId) {
        return res.status(500).send("The id that was sent did not match the userId");
    }
    // its written this way to trigger the remove hooks
    User.findById(currentUserId, function(err, user) {
        if (err) return res.status(500).send(err);
        user.remove(function() {
            req.session.destroy();
            return res.send(204);
        });
    });
};
/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);
    User.findById(userId, SCHEMA_USER_HIDE_FROM_ME, function(err, user) {
        if (user.authenticate(oldPass)) {
            user.password = newPass;
            user.forgotPassCode = uuid.v4();
            user.save(function(err) {
                if (err) return validationError(res, err);
                res.send(200);
            });
        } else {
            res.send(403);
        }
    });
};
/**
 * Change a users password
 * This is done by the uuid
 * also note that the uuid code
 * requires a hash of it
 * code1 is the User.changePasswordCode
 * code2 is the sha1 hash of code1
 */
exports.resetChangePassword = function(req, res, next) {
    var newPass = String(req.body.newPassword);
    var code1 = String(req.body.resetCode1);
    var code2 = String(req.body.resetCode2);
    if (code2 != sha1(code1)) {
        return res.status(403).json({
            message: "Incorrect reset code",
            status: "error"
        });
    }
    User.findOne({
        "forgotPassCode": code1
    }, SCHEMA_USER_HIDE_FROM_ME, function(err, user) {
        if (err || user == null) {
            return res.status(404).json({
                status: "error",
                message: "There is no account with that email address."
            });
        } else {
            user.password = newPass;
            user.forgotPassCode = uuid.v4();
            user.save(function(err) {
                if (err) return validationError(res, err);
                return res.send(200);
            });
        }
    });
};
/**
 * Send a verification email to the email address
 */
exports.sendVerificationEmail = function(req, res, next) {
        var currentUserId = req.session.userId;
        //var userId = req.user._id;
        User.findById(currentUserId, function(err, user) {
            if (err || user == null) {
                return res.status(500).json({
                    status: "error",
                    message: "We Couldn't find your account."
                });
                return;
            }
            if (user.verification.status == true) {
                return res.status(500).json({
                    status: "warn",
                    message: "Your email address is already verified"
                });
            }
            Emailer.resendVerification(req, res, user.email, user.verification.code);
        });
    }
    /**
     * Send a forgot password email to the email address
     * This way they can change their password
     */
exports.sendForgotPasswordEmail = function(req, res, next) {
    User.findOne({
        "email": req.param('email')
    }, function(err, user) {
        if (err || user == null) {
            return res.status(404).json({
                status: "error",
                message: "There is no account with that email address."
            });
        } else {
            if (user.forgotPassCode == undefined) {
                return res.status(404).json({
                    status: "error",
                    message: "Test email accounts do not have forgotPasswordCodes"
                });
            } else {
                return Emailer.sendForgotPasswordEmail(req, res, user.email, user.forgotPassCode, sha1(user.forgotPassCode));
            }
        }
    });
}
exports.verifyEmailCompleted = function(req, res, next) {
        //TODO: find the verification code in the thing
        var code = req.param('code');
        if (code == undefined) return res.status(500).send("Invalid verification code, please check again");
        User.findOne({
            "verification.code": code
        }, function(err, user) {
            if (err || user == null) {
                return res.status(500).send("Invalid verification code");
            }
            user.verification.status = true;
            user.save(function(err) {
                if (err) return validationError(res, err);
                res.redirect('/tasqs');
            });
        });
    }
    /**
     * Checks to see if my email is verified
     * This will use the session id for user id
     */
exports.isEmailVerified = function(req, res, next) {
        if (!req.session.userId) {
            return shutdown(req, res);
        }
        User.findById(req.session.userId, function(err, user) {
            if (err || user == null) {
                return res.status(500).json({
                    status: "error",
                    message: "We Couldn't find your account."
                });
            }
            if (user.verification.status == true) {
                next();
            } else {
                return res.status(500).json("Please verify your email first. You can resend a verification email in your settings page <a href='/settings'>here</a>");
            }
        });
    }
    /**
     * Get my info
     */
exports.me = function(req, res, next) {
    //console.log("Session: ",req.session);
    var userId = req.user._id;
    User.findOne({
        _id: userId
    }, '-salt -hashedPassword -verification.code -forgotPassCode -phone.verifyCode -phone.attempts', function(err, user) { // don't ever give out the password or salt
        if (err) return next(err);
        if (!user) return res.json(401);
        //test the accessToken if it expired then have them relog
        if (user.isConnectedWithFb && user.fb.accessToken) {
            graph.get("/me?access_token=" + user.fb.accessToken, function(err, data) {
                //console.log(data);
                if (err) {
                    //this means that the token is no longer valid and will require the user to reconnect
                    //to make them reconnect we should send a message back
                    user.isConnectedWithFb = false;
                    user.save(function(err) {
                        if (err) return validationError(res, err);
                        return res.send(200);
                    });
                } else {
                    var response = user;
                    if (response.fb) response.fb = undefined;
                    return res.json(response);
                }
            });
        } else {
            var response = user;
            if (response.fb) response.fb = undefined;
            return res.json(response);
        }
    });
};
/**
 * Search for users
 * the max number of users that can be returned is 30
 * this is used in the find friends
 **/
exports.search = function(req, res) {
    var name = req.param('name');
    if (name == undefined) return res.status(400).send("Missing parameter, name");
    if (name.match(/^[-\sa-zA-Z0-9\']+$/) == null) return res.status(400).send("Name contains invalid characters");
    User.find({
        name: new RegExp('^' + name, "i")
    }, SCHEMA_USER_HIDE_FROM_OTHERS).sort({
        'updated': -1
    }).limit(30).exec(function(err, users) {
        if (err) return res.status(500).send(err);
        var everyoneButMe = _.filter(users, function(item) {
            return !item._id.equals(req.session.userId);
        });
        return res.status(200).json(everyoneButMe);
    });
}

function isChangeAllowed(field, value) {
    function _boolean(v) {
        return (typeof v == "boolean");
    }
    var allowedSchema = {
        'phone.ignorePrompt': _boolean,
        'phone.enableNotifications': _boolean
    };
    var validation = allowedSchema[field];
    if (validation == undefined) {
        return false;
    }
    return validation(value)
}


exports.setField = function(req, res) {
    var field = req.param('field');
    var value = req.param('value');
    var currentUserId = req.session.userId;
    if (field == undefined) return res.status(400).send("Missing parameter field");
    if (value == undefined) return res.status(400).send("Missing parameter value");
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    // check field for allowed fields
    if (!isChangeAllowed(field, value)) {
        return res.status(500).send("Unallowed to change field to that value ", field, value);
    }
    User.findById(currentUserId, SCHEMA_USER_HIDE_FROM_ME, function(err, user) {
        if (err) return validationError(res, err);
        if (!user) return res.status(404).send("User not found");

        _.set(user, field, value);
        user.save(function(err) {
            if (err) return validationError(res, err);
            return res.status(200).json(_.get(user, field));
        })
    })



}
exports.authCallback = function(req, res, next) {
    res.redirect('/');
};

function shutdown(req, res) {
    req.session.destroy();
    return res.redirect('/login');
}
