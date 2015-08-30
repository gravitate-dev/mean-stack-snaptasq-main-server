/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /communities              ->  index
 * POST    /communities              ->  create
 * GET     /communities/:id          ->  show
 * PUT     /communities/:id          ->  update
 * DELETE  /communities/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Community = require('./community.model');
var User = require('../user/user.model');
var Task = require('../task/task.model');
var CryptoJS = require("crypto-js");
var sms = require('../sms/sms.controller');
var Email = require('../email/email.controller');
var config = require('../../config/environment');


function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// Get list of communities
exports.index = function(req, res) {
    var query = req.query; //req.query is the query params
    Community.find(query, '', function(err, comms) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, comms);
    });
};

exports.getMine = function(req, res) {
    Community.find({}, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, comms) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, comms);
    });
};
// Get a single comm
exports.show = function(req, res) {
    Community.findById(req.params.id, function(err, comm) {
        if (err) {
            return handleError(res, err);
        }
        if (!comm) {
            return res.send(404);
        }
        return res.json(comm);
    });
};

// Creates a new community in the DB.
// @require admin
exports.create = function(req, res) {
    Community.create(req.body, function(err, comm) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(201, comm);
    });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Community.findById(req.params.id, function(err, comm) {
        if (err) {
            return handleError(res, err);
        }
        if (!comm) {
            return res.send(404);
        }
        var updated = _.merge(comm, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, comm);
        });
    });
};

// Deletes a comm from the DB.
exports.destroy = function(req, res) {
    Community.findById(req.params.id, function(err, comm) {
        if (err) {
            return handleError(res, err);
        }
        if (!comm) {
            return res.send(404);
        }
        comm.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.send(204);
        });
    });
};

/*
// Encrypt
var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123');

// Decrypt
var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123');
var plaintext = bytes.toString(CryptoJS.enc.Utf8);
console.log(plaintext==null)
console.log(plaintext==undefined)
console.log(plaintext=="")
console.log(ciphertext.toString());
console.log(plaintext);
*/
/**
 * This will request for a user to join a private group
 * 1. The group is obtained with the group id
 * 2. The user is obtained with the user id
 * 3. CHECK if the user is already in the group
 * 4. CHECK if the group is not open
 * 5. COMPARE {creds} is valid
 * 5a. IF true send email with activation code
 * 5b. IF false return error
 * @param challengeId: The id of the authenticaiton challenge of the community that the user took
 **/
exports.requestJoin = function(req, res) {
    var groupId = req.param('id');
    var userId = req.param('applicantId');
    var creds = req.param('creds');
    var challengeId = req.param('challengeId');
    if (userId == undefined)
        return res.send(500, "missing userId");
    if (groupId == undefined)
        return res.send(500, "missing groupId");
    Community.findById(groupId, function(err, comm) {
        if (err) {
            return handleError(res, err);
        }
        if (!comm) {
            return res.send(404);
        }
        User.findById(userId, function(err, user) {
            if (err) {
                return handleError(res, err);
            }
            if (!user) {
                return res.send(404);
            }
            //find the right auth method they chose
            for (var i = 0; i < comm.challenges.length; i++) {
                if (challengeId == comm.challenges[i].id) {
                    _handleChallenge(req, res, comm.challenges[i], comm, user, creds);
                }
            }

        });
    });
}

function _handleChallenge(req, res, challenge, comm, user, creds) {
    if (challenge == undefined)
        return res.send(500, "Challenge not valid");
    if (_isUserAlreadyInGroup(comm, user)) {
        return res.send(200, "You are already in this group");
    }
    if (_isBannedFromGroup(comm, user))
        return res.send(403, "You are banned from this group. Sorry!");
    switch (challenge.type) {
        /* beautify ignore:start*/
        case "open":
            return _handleJoinOpen(req, res, challenge, comm, user, creds);
        case "email":
            return _handleJoinEmail(req, res, challenge, comm, user, creds);
        case "areacode":
            return _handleJoinAreaCode(req, res, challenge, comm, user, creds);
        case "code":
            return _handleJoinCode(req, res, challenge, comm, user, creds);
        default:
            return res.send(500, "Unknown entry method" + comm.entryMethod);
            /* beautify ignore:end*/
    }
}

function _handleJoinOpen(req, res, challenge, comm, user, creds) {
    return _addUserToComm(req, res, comm, user);
}

function _handleJoinEmail(req, res, challenge, comm, user, creds) {
    _.each(challenge.answers, function(answer) {
        if (creds.indexOf(answer) != -1) {
            var joinLink = _generateJoinLink(comm, user)
            Email.sendCommunityJoinCode(req, res, creds, comm.name, joinLink);
            return res.send(200, "Check your email address for an activation code. " + creds);
        }
    });
    return res.send(403, "Sorry this email address does not match the qualifications.");
}

function _handleJoinAreaCode(req, res, challenge, comm, user, creds) {
    //function assumes creds will be in a format without an extension
    //it will match 51053424232
    if (creds == undefined || creds.length < 5) {
        return res.send(403, "Invalid phone number");
    }
    var areaCode = creds.replace(/\D/g, '').substr(0, 3);
    _.each(challenge.answers, function(answer) {
        if (areaCode == answer) {
            sms.text(creds, "to join the snaptasq community, " + comm.name + " open this link " + _generateJoinLink(comm, user));
            return res.send(200, "Check your phone for a link we sent you. " + creds);
        }
    });
    return res.send(403, "This phone number is not allowed. " + creds);
}

function _handleJoinCode(req, res, challenge, comm, user, creds) {
    _.each(challenge.answers, function(answer) {
        if (creds == answer) {
            return _addUserToComm(req, res, comm, user);
        }
    });
    return res.send(403, "Sorry wrong code.");
}

function _generateJoinLink(comm, user) {
    // Encrypt
    var eUserId = CryptoJS.AES.encrypt(user._id.toString(), comm._id.toString()).toString();
    console.log("User id: " + user._id.toString());
    eUserId = eUserId.replace(/\+/g, 'PLUS').replace(/\-/g, 'MINUS').replace(/\//g, 'SLASH').replace(/=/g, 'EQUALS');
    return config.host.url + "api/communities/" + comm._id.toString() + "/join/" + eUserId;
}

function _isBannedFromGroup(comm, user) {
    var isBanned = false;
    _.each(user.communityMembershipsBans, function(id) {
        if (comm._id.equals(id)) {
            isBanned = true;
        }
    });
    return isBanned;
}

function _isUserAlreadyInGroup(comm, user) {
    for (var i = 0; i < user.communityMemberships.length; i++) {
        if (user.communityMemberships[i].equals(comm._id))
            return true;
    }
    return false;
}

function _addUserToComm(req, res, comm, user) {
    //first check that i dont contain the group id already
    if (_isUserAlreadyInGroup(comm, user)) {
        return res.send(200, "You are already in this group");
    }
    user.communityMemberships.push(comm._id);
    user.save(function(err, user) {
        if (err) return handleError(res, err);
        comm.totalUsers++;
        comm.save(function(err, comm) {
            if (err) return handleError(res, err);
            return res.send(200, "Welcome to the group.");
        });
    });

}

exports.getTasks = function(req, res) {
    var groupId = req.param('id');
    Task.find({
        'communitiesIn.id': groupId
    }, function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, tasks);
    });
}

exports.join = function(req, res) {
    var groupId = req.param('id');
    var eUserId = req.param('encUserId');
    eUserId = replaceAll(eUserId, 'PLUS', '+');
    eUserId = replaceAll(eUserId, 'MINUS', '-');
    eUserId = replaceAll(eUserId, 'SLASH', '/');
    eUserId = replaceAll(eUserId, 'EQUALS', '=');
    //55e2027371be3e9c2d88b56e
    // Decrypt
    var bytes = CryptoJS.AES.decrypt(eUserId, groupId);
    var userId = bytes.toString(CryptoJS.enc.Utf8);
    console.log(userId);
    if (userId == null || userId == undefined || userId == "")
        return res.status(403, "Expired or invalid community join link");
    User.findById(userId, function(err, user) {
        if (err) {
            return handleError(res, err)
        }
        if (!user) return res.send(404, "User could not be found by id: " + userId);
        Community.findById(req.params.id, function(err, comm) {
            if (err) {
                return handleError(res, err);
            }
            if (!comm) {
                return res.send(404, "Community does not exist");
            }
            return _addUserToComm(comm, user);
        });
    });

}

function handleError(res, err) {
    return res.send(500, err);
}
