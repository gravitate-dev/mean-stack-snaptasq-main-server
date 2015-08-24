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
    console.log("SHOW");
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


/**
 * This will request for a user to join a private group
 * 1. The group is obtained with the group id
 * 2. The user is obtained with the user id
 * 3. CHECK if the user is already in the group
 * 4. CHECK if the group is not open
 * 5. COMPARE {creds} is valid
 * 5a. IF true send email with activation code
 * 5b. IF false return error
 **/
exports.requestJoin = function(req, res) {
    var groupId = req.param('id');
    var userId = req.param('applicantId');
    var creds = req.param('creds');
    if (creds == undefined)
        return res.send(500, "missing credentials");
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

            switch (comm.entryMethod) {
                case "open":
                    return _handleJoinOpen(req, res, comm, user, creds);
                case "email":
                    return _handleJoinEmail(req, res, comm, user, creds);
                case "areacode":
                    return _handleJoinAreaCode(req, res, comm, user, creds);
                case "code":
                    return _handleJoinCode(req, res, comm, user, creds);
                default:
                    return res.send(500, "Unknown entry method" + comm.entryMethod);
            }

        });
    });
}

function _handleJoinOpen(req, res, comm, user, creds) {
    return res.send(200, "Welcome to the group");
}

function _handleJoinEmail(req, res, comm, user, creds) {
    if (creds.indexOf(comm.entryParam) != -1) {
        return res.send(200, "Check your email address for an activation code. " + creds);
    } else {
        return res.send(403, "Only email addresses ending in " + comm.entryParam + " are allowed");
    }
}

function _handleJoinAreaCode(req, res, comm, user, creds) {
    //function assumes creds will be in a format without an extension
    //it will match 51053424232
    var areaCode = creds.replace(/\D/g, '').substr(0, 3);
    if (comm.entryParam == areaCode) {
        return res.send(200, "Check your phone for entry your code. " + creds);
    } else {
        return res.send(403, "Only phone numbers with " + comm.entryParam + " are allowed");
    }

}

function _handleJoinCode(req, res, comm, user, creds) {
    if (comm.entryParam == creds)
        return res.send(200, "Welcome to the group.");
    else
        return res.send(403, "Incorrect secret code");
}

function handleError(res, err) {
    return res.send(500, err);
}
