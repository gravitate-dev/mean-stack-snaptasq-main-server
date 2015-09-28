'use strict';
var _ = require('lodash');
var Beta = require('./beta.model');
var User = require('../user/user.model');
var uuid = require('uuid');
var RateLimiter = require('limiter').RateLimiter;
// Allow 150 requests per hour (the Twitter search limit). Also understands 
// 'second', 'minute', 'day', or a number of milliseconds 
var limiter = new RateLimiter(5, 'minute', true);

// Get list of tasks
exports.index = function(req, res) {
    Beta.find({}, '-__v', function(err, betas) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(betas);
    });

};

exports.isValidCode = function(req, res, next) {
    limiter.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.status(429).send('Too Many Requests - your IP is being rate limited. Please try again in one minute');
        } else {
            var betaCode = req.body.id;
            Beta.findOne({
                "name": betaCode
            }, function(err, beta) {
                if (err) return handleError(res, err);
                if (!beta) return res.status(500).send("This beta code has is no longer valid. Check your spelling.");
                if (beta.status != "active") return res.status(500).send("This beta code has is no longer valid. It is set to inactive");
                if (beta.maxUses <= beta.uses) return res.status(500).send("This beta code is no longer valid. It has been used up by " + beta.maxUses + " people already.");
                if (beta.isCodeRoot == false) {
                    //if the beta code is not root, then we will need to remove it from the user that has it
                    User.update({
                        personalBetaCodes: betaCode
                    }, {
                        $pull: {
                            'personalBetaCodes': betaCode
                        }
                    }, function(err) {});
                    /*User.findOne({personalBetaCodes:betaCode},function(err,user){

                    });*/
                }
                req.beta = beta;
                return next(); //res.status(200).send("OK");
            });
        }
    });
}
exports.deactivate = function(req, res, next) {
    var betaId = req.params.id;

    Beta.findById(betaId, function(err, beta) {
        if (!beta) return res.status(500).json({
            message: "beta not found for id " + betaId
        });
        beta.status = "inactive";
        beta.save(function(err) {
            if (err) return validationError(res, err);
            res.send(200);
        });
    });
};

exports.activate = function(req, res, next) {
    var betaId = req.params.id;

    Beta.findById(betaId, function(err, beta) {
        if (!beta) res.status(500).json({
            message: "beta not found for id " + betaId
        });
        beta.status = "active";
        beta.save(function(err) {
            if (err) return validationError(res, err);
            res.send(200);
        });
    });
};


/**
 * Uses a beta code, if the usedByIp field detects multiple accounts
 * This will block them from registering
 **/
exports.redeem = function(req, res, next) {
    var betaCode = req.body.id;
    //var ipAddress = req.ip;
    //console.log("Hello " + ipAddress);

    Beta.findOne({
        "name": betaCode
    }, function(err, beta) {
        if (!beta) return res.status(400).send("Invalid beta code");
        if (beta.status != "active") return res.status(400).send("Beta code invalid");
        if (beta.maxUses <= beta.uses) return res.status(400).send("Beta code has reached its max uses");
        beta.uses += 1;
        beta.save(function(err) {
            if (err) return validationError(res, err);
            return res.status(200).send("Success, welcome to the beta");
        });
    });
};


/**
 * Creates a personal beta code, this does not spawn more codes as its not root
 */
exports.generatePersonalInviteCode = function(userObj) {
        var code = uuid.v4();
        var beta = {
            name: code,
            ownerName: userObj.name,
            ownerId: userObj._id,
            status: "active",
            maxUses: 1,
            isCodeRoot: false
        };
        var newBeta = new Beta(beta);
        Beta.create(newBeta, function(err, beta) {});
        return code;
    }
    // Creates a beta code, requires admin
exports.create = function(req, res) {
    var newBeta = new Beta(req.body);
    newBeta.isCodeRoot = true;
    if (newBeta.maxUses > 100) {
        return res.status(500).json({
            message: "maxUses can have a max of 100"
        });
    }
    var currentUserId = req.session.userId;
    if (currentUserId == 0 || !currentUserId) {
        return res.status(401).json({
            message: "Please relogin first"
        });
    }
    newBeta.ownerId = currentUserId;
    Beta.create(newBeta, function(err, beta) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(beta);
    });
}

// Deletes a beta from the DB.
exports.destroy = function(req, res) {
    Beta.findByIdAndRemove(req.params.id, function(err, user) {
        if (err) return res.status(500).send(err);
        return res.send(204);
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
}
