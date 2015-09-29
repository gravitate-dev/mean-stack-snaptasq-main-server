'use strict';
var _ = require('lodash');
var Task = require('./task.model');
var User = require('../user/user.model');
var Emailer = require('../email/email.controller');
var Texter = require('../texter/texter.controller');
var config = require('../../config/environment');
var Notify = require('../notify/notify.controller');
var moment = require('moment');
var RateLimiter = require('limiter').RateLimiter;
var limiterCreateTask = new RateLimiter(4, 'hour', true);
var limiterSetTasker = new RateLimiter(10, 'hour', true);
var limiterStartTaskNotify = new RateLimiter(4, 'hour', true);
// technically i never return any USER json so these are unneded but i have them here anyways
var SCHEMA_USER_HIDE_FROM_ME = '-salt -hashedPassword -verification.code -forgotPassCode -phone.verifyCode -phone.attempts';
var SCHEMA_USER_HIDE_FROM_OTHERS = '-salt -hashedPassword -verification.code -forgotPassCode -phone.verifyCode -phone.number -phone.newNumber -personalBetaCodes -doNotAutoFriend';
// Get list of tasks
exports.index = function(req, res) {
    Task.find({}, '-__v', function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(tasks);
    });
};
exports.getMyAppliedTasks = function(req, res) {
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    var query = {};
    if (req.dsl) query = req.dsl;
    query['applicants.id'] = currentUserId;
    Task.find(query, '-__v').sort({
        'created': -1
    }).limit(10).exec(function(err, tasks) {
        if (err) return handleError(res, err);
        return res.status(200).json(tasks);
    });
}
exports.getMyTasks = function(req, res) {
        var currentUserId = req.session.userId;
        var query = {};
        if (req.dsl) query = req.dsl;
        query.ownerId = currentUserId;
        Task.find(query, '-__v').sort({
            'created': -1
        }).limit(10).exec(function(err, tasks) {
            if (err) return handleError(res, err);
            return res.status(200).json(tasks);
        });
    }
    /**
    This gets another users tasks not Really a friend
    **/
exports.getUsersTasksByUserId = function(req, res) {
    //TODO check if they are friends
    var currentUserId = req.session.userId;
    var id = req.params.id
    if (id == undefined) return res.status(400).send("Missing parameter id");
    var query = {};
    if (req.dsl) query = req.dsl;
    query.ownerId = id;
    Task.find(query, '-__v').sort({
        'created': -1
    }).limit(10).exec(function(err, tasks) {
        if (err) return handleError(res, err);
        return res.status(200).json(tasks);
    });
}
exports.getMyFriendsTasks = function(req, res) {
        User.findOne({
            _id: req.session.userId
        }, SCHEMA_USER_HIDE_FROM_OTHERS, function(err, user) { // don't ever give out the password or salt
            if (err) return next(err);
            if (!user) return res.send(401);
            var myFriendsIds = _.pluck(user.friends, "id");
            var query = {};
            if (req.dsl) query = req.dsl;
            query.ownerId = {
                $in: myFriendsIds
            };
            Task.find(query, '-__v').sort({
                'created': -1
            }).limit(10).exec(function(err, tasks) {
                if (err) return handleError(res, err);
                return res.status(200).json(tasks);
            });
            //from me i want to get all my tasks owned by my friends
        });
    }
    // Get a single task
exports.show = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.sendStatus(404);
        }
        return res.json(task);
    });
};
// Creates a new task in the DB.
exports.create = function(req, res) {
    limiterCreateTask.removeTokens(1, function(err, remainingRequests) {
        if (remainingRequests < 0) {
            return res.status(429).send("Too many tasqs created, try again in an hour");
        } else {
            var newTask = new Task(req.body);
            var currentUserId = req.session.userId;
            if (currentUserId == undefined) return res.status(401).send("Please login again");
            newTask.ownerId = currentUserId;
            User.findOne({
                _id: currentUserId
            }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
                if (err) return res.status(500).json(err);
                if (!user) return res.sendStatus(401);
                newTask.ownerName = user.name;
                newTask.ownerPic = user.pic;
                newTask.historicalPrices.push({
                    price: newTask.payout
                });
                Task.create(newTask, function(err, task) {
                    if (err) {
                        return handleError(res, err);
                    }
                    var friendIds = _.pluck(user.friends, "id");
                    Notify.put({
                        forOne: currentUserId,
                        forMany: friendIds,
                        hrefId: task._id,
                        code: Notify.CODES.taskOwner.created,
                        pic: user.pic,
                        params: {
                            task: task.name,
                            name: user.name
                        }
                    });
                    return res.status(201).json(task);
                });
            });
        }
    });
};
// Updates an existing task in the DB.
exports.update = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }
        task.location = undefined;
        var updatedTask = _.merge(task, req.body);
        var currentUserId = req.session.userId;
        updatedTask.ownerId = currentUserId;
        updatedTask.historicalPrices.push({
            price: updatedTask.payout
        });
        User.findOne({
            _id: currentUserId
        }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
            if (err) return res.status(500).json(err);
            if (!user) return res.json(401);
            updatedTask.ownerName = user.name;
            updatedTask.ownerPic = user.pic;
            updatedTask.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.status(200).json(task);
            });
        });
    });
};
exports.isTaskOwner = function(req, res, next) {
        Task.findById(req.params.id, function(err, task) {
            if (err) {
                return handleError(res, err);
            }
            if (!task) {
                return res.send(404);
            }
            var currentUserId = req.session.userId;
            if (!task.ownerId.equals(req.session.userId)) {
                return res.status(403).send("You do not own this tasq");
            }
            next();
        });
    }
    /**
     * Allows a user to apply to help for a task
     **/
exports.applyToTask = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }
        var currentUserId = req.session.userId;
        var canApply = true;
        _.each(task.applicants, function(item) {
            if (item.id.equals(currentUserId)) canApply = false;
        });
        if (!canApply) {
            return res.status(400).send("You already applied to help");
        } else {
            User.findOne({
                _id: currentUserId
            }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
                if (err) return res.status(500).json(err);
                if (!user) return res.json(401);
                if (user.fb && user.fb.id) task.applicants.push({
                    id: user._id,
                    name: user.name,
                    pic: user.pic,
                    fbId: user.fb.id
                });
                else task.applicants.push({
                    id: user._id,
                    name: user.name,
                    pic: user.pic
                });
                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return handleError(res, err);
                    }
                    var textOwner = false;
                    if (task.hasTextedForFirstApplicant == false) {
                        textOwner = true;
                        task.hasTextedForFirstApplicant = true;
                    }
                    task.save(function(err) {
                        if (err) {
                            return handleError(res, err);
                        }
                        if (textOwner) {
                            // Text Task Owner, new Applicant only for first applicant
                            User.findById(task.ownerId, function(err, owner) {
                                //ignore error if happens
                                if (owner) {
                                    var taskUri = config.host.url + "tasq/view/" + task._id;
                                    if (owner.phone.number != undefined && owner.phone.enableNotifications == true) {
                                        Texter.sendFirstApplicantTaskOwner(owner.phone.number, taskUri, task.name, user.name);
                                    }
                                }
                            });
                        }
                        // Task Owner, new Applicant
                        Notify.put({
                            forOne: task.ownerId,
                            forMany: [],
                            hrefId: task._id,
                            code: Notify.CODES.taskOwner.newApplicant,
                            pic: user.pic,
                            params: {
                                task: task.name,
                                name: user.name
                            }
                        });
                        // Task Applicant, new task applied to
                        Notify.put({
                            forOne: user._id,
                            forMany: [],
                            hrefId: task._id,
                            code: Notify.CODES.taskApplicant.created,
                            pic: user.pic,
                            params: {
                                task: task.name,
                                ownerName: task.ownerName
                            }
                        });
                        return res.status(200).json(task);
                    });
                });
            });
        }
    });
};
/**
 * A Tasker can signal they are starting the task with this api call
 **/
exports.startTask = function(req, res) {
    var taskId = req.params.id
    if (taskId == undefined) return res.status(400).send("Missing parameter id. For the TaskID");
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    Task.findById(taskId, function(err, task) {
        if (err) return handleError(res, err);
        if (!task) return res.status(404).send("Tasq not found");
        if (task.tasker != undefined && task.tasker.id != undefined && task.tasker.id.equals(currentUserId)) {
            task.endTime = undefined;
            task.totalTime = undefined;
            task.startTime = Date.now();
            task.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                limiterStartTaskNotify.removeTokens(1, function(err, remainingRequests) {
                    if (remainingRequests > 0) {
                        Notify.put({
                            forOne: task.ownerId,
                            forMany: [],
                            hrefId: task._id,
                            code: Notify.CODES.taskOwner.taskerStarted,
                            pic: task.tasker.pic,
                            params: {
                                task: task.name,
                                name: task.tasker.name
                            }
                        });
                        User.findById(task.ownerId, function(err, user) {
                            //ignore error if happens
                            if (user) {
                                var taskUri = config.host.url + "tasq/view/" + task._id;
                                if (user.phone.number != undefined && user.phone.enableNotifications == true) {
                                    Texter.sendTaskerStartedTaskOwner(user.phone.number, taskUri, task.name, task.tasker.name);
                                }
                            }
                        });
                    } else {
                        // the notification will not be put because spam detected
                        console.error("startTask was clicked too often by userID", currentUserId);
                    }
                });
                return res.status(200).json(task);
            });
        } else {
            return res.status(500).send("You are not the current tasker anymore");
        }
    });
};
/**
 * A Tasker can signal they finished the task
 **/
exports.finishTask = function(req, res) {
    var taskId = req.params.id
    if (taskId == undefined) return res.status(400).send("Missing parameter id. For the TaskID");
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    Task.findById(taskId, function(err, task) {
        if (err) return handleError(res, err);
        if (!task) return res.status(404).send("Tasq not found");
        if (task.startTime == undefined) {
            return res.status(500).send("You must start the tasq first before completeing it.");
        }
        if (task.tasker != undefined && task.tasker.id != undefined && task.tasker.id.equals(currentUserId)) {
            //
            task.endTime = Date.now();
            task.totalTime = Math.floor((task.endTime - task.startTime) / (1000 * 60)); //in minutes
            task.status = "completed";
            task.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                // Task Owner, task completed
                Notify.put({
                    forOne: task.ownerId,
                    forMany: [],
                    hrefId: task._id,
                    code: Notify.CODES.taskOwner.taskerFinished,
                    pic: task.tasker.pic,
                    params: {
                        task: task.name,
                        name: task.tasker.name
                    }
                });
                // Task Applicants, task completed
                var applicantIds = _.pluck(task.applicants, 'id');
                applicantIds = _.filter(applicantIds, function(id) {
                    return !id.equals(task.tasker.id);
                });
                // one is the tasker
                // many are the applicants minus tasker
                Notify.put({
                    forOne: task.tasker.id,
                    forMany: applicantIds,
                    hrefId: task._id,
                    code: Notify.CODES.taskApplicant.taskerCompleted,
                    pic: task.tasker.pic,
                    params: {
                        task: task.name,
                        chosenName: task.tasker.name,
                        ownerName: task.ownerName
                    }
                });
                return res.status(200).json(task);
            });
        } else {
            return res.status(500).send("You are not the current tasker anymore");
        }
    });
};
/**
 * Owner can set who they want to help them from the
 * Applicants, if no user id is passed, we can say
 * the tasker has been removed or no tasker
 * /:id/:applicantId/setTasker
 * @requires, the task must be owned by the caller
 * @param id: taskId
 * @param applicantId: User id who should be the tasker
 
 * @pre: checked by isTaskOwner for null task, and task ownership
 **/
exports.setTasker = function(req, res) {
    var taskId = req.params.id
    if (taskId == undefined) return res.status(400).send("Missing parameter id. For the TaskID");
    var chosenApplicantId = req.param('applicantId');
    //Not checking for undefined because i allow undefined, when the tasker is set to none.
    Task.findById(taskId, function(err, task) {
        var didApplicantApplyToTask = false;
        if (chosenApplicantId != undefined) {
            _.each(task.applicants, function(item) {
                if (item.id.equals(chosenApplicantId)) didApplicantApplyToTask = true;
            });
            if (!didApplicantApplyToTask) {
                return res.status(500).send("This person is not applying for your task");
            }
            User.findOne({
                _id: chosenApplicantId
            }, '-salt -hashedPassword -verification.code -forgotPassCode', function(err, user) {
                if (err) return res.status(500).json(err);
                if (!user) return res.status(404).send("User does not exist");
                task.tasker = {
                    id: user._id,
                    name: user.name,
                    pic: user.pic,
                    fbId: user.fb.id
                };
                if (user.fb && user.fb.id) task.tasker.fbId = user.fb.id;
                task.startTime = undefined;
                task.endTime = undefined;
                task.totalTime = undefined;
                task.status = "in progress";
                task.historicalTaskers.push({
                    id: user._id,
                    name: user.name
                });
                task.save(function(err) {
                    if (err) {
                        return handleError(res, err);
                    }
                    var applicantIds = _.pluck(task.applicants, 'id');
                    applicantIds = _.filter(applicantIds, function(id) {
                        return !id.equals(task.tasker.id);
                    });
                    // Task Applicants, tasker chosen
                    Notify.put({
                        forOne: task.tasker.id,
                        forMany: applicantIds,
                        hrefId: task._id,
                        code: Notify.CODES.taskApplicant.taskerChosen,
                        pic: task.ownerPic,
                        params: {
                            task: task.name,
                            chosenName: user.name,
                            ownerName: task.ownerName
                        }
                    });
                    //https://snaptasq.com/task/view/55c82438ede999467491c629
                    //TODO write a wrapper for emailer
                    limiterSetTasker.removeTokens(1, function(err, remainingRequests) {
                        if (remainingRequests > 0) {
                            var taskUri = config.host.url + "tasq/view/" + task._id;
                            Emailer.sendRequestTaskerHelp(null, null, user.email, taskUri, task.name, task.ownerName, task.ownerPic);
                            if (user.phone.number != undefined && user.phone.enableNotifications == true) {
                                Texter.sendRequestTaskerHelp(user.phone.number, taskUri, task.name, task.ownerName);
                            }
                        }
                        return res.status(200).json(task);
                    });
                });
            });
        } else {
            if (task.tasker.id == undefined) {
                //do nothing, tasker was already unassigned!
                console.error("Tasker already unset", task.name);
                return res.status(200).json(task);
            } else {
                var applicantIds = _.pluck(task.applicants, 'id');
                applicantIds = _.filter(applicantIds, function(id) {
                        return !id.equals(task.tasker.id);
                    })
                    // Task Applicants, task is now open
                    // one = chosen tasker
                    // many = applicants minus me
                Notify.put({
                    forOne: task.tasker.id,
                    forMany: applicantIds,
                    hrefId: task._id,
                    code: Notify.CODES.taskApplicant.taskerUnchosen,
                    params: {
                        task: task.name
                    }
                });
                task.tasker = {
                    id: undefined
                };
                task.markModified('tasker');
                task.startTime = undefined;
                task.endTime = undefined;
                task.totalTime = undefined;
                task.status = "open";
                task.save(function(err) {
                    if (err) {
                        return handleError(res, err);
                    }
                    return res.status(200).json(task);
                });
            }
        }
    });
};
/**
 * Removes a given applicant from a task
 * @param task: the task
 * @param applicantId : the Mongoose Schema _id of a user
 * @returns : the task
 **/
function removeApplicantFromTaskById(task, applicantId) {
    for (var i = task.applicants.length - 1; i >= 0; i--) {
        if (task.applicants[i].id.equals(applicantId)) {
            task.applicants.splice(i, 1);
            break;
        }
    }
    return task;
}
// yes i know duplicate function. i can refactor lator.
//TODO: refactor this along with its cousin removeApplicantsFromTaskById
function isAppliantToTask(task, applicantId) {
    for (var i = task.applicants.length - 1; i >= 0; i--) {
        if (task.applicants[i].id.equals(applicantId)) {
            return true;
        }
    }
    return false;
}

function isUserTasker(task, userId) {
    if (task.tasker.id == undefined) return false;
    return task.tasker.id.equals(userId);
}
/**
 * Allowsa user to apply to help for a task
 **/
exports.unapplyToTask = function(req, res) {
    var id = req.params.id
    var currentUserId = req.session.userId;
    if (id == undefined) return res.status(400).send("Missing parameter id. The Task Id");
    if (currentUserId == undefined) return res.status(401).send("Please login again");
    Task.findById(id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.status(404).send("Tasq not found");
        }
        if (isAppliantToTask(task, currentUserId) == false) {
            return res.status(200).send("Already not applied");
        }
        task = removeApplicantFromTaskById(task, currentUserId);
        var wasTaskerRemoved = false;
        var taskerName = "";
        if (isUserTasker(task, currentUserId)) {
            //this is when the TASKER quits
            taskerName = task.tasker.name;
            task.tasker = {
                id: undefined
            };
            task.status = "open";
            task.startTime = undefined;
            task.endTime = undefined;
            task.totalTime = undefined;
            wasTaskerRemoved = true;
        }
        task.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            if (wasTaskerRemoved) {
                Notify.put({
                    forOne: task.ownerId,
                    forMany: [],
                    hrefId: task._id,
                    code: Notify.CODES.taskOwner.taskerQuit,
                    params: {
                        task: task.name,
                        name: taskerName
                    }
                });
            } else {
                // no notification if an applicant quits your task.
                // by design
            }
            return res.status(200).json(task);
        });
    });
};
// Deletes a task from the DB.
exports.destroy = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }
        var currentUserId = req.session.userId;
        if (task.ownerId != currentUserId) {
            return res.status(403).send("Only owners can delete their own tasks."); //unauthorized
        }
        task.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(204).send("Success");
        });
    });
};
//delete All Owned Tasks
exports.destroyAllOwnedTasksForCurrentUser = function(req, res, next) {
    var currentUserId = req.session.userId;
    if (currentUserId == undefined) return res.status(401).send("Please login");
    Task.find({
        ownerId: currentUserId
    }).remove(function() {
        next();
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
}
