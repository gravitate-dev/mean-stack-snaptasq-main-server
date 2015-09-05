'use strict';
var _ = require('lodash');
var Task = require('./task.model');
var User = require('../user/user.model');
var Emailer = require('../email/email.controller');
var config = require('../../config/environment');
var Notify = require('../notify/notify.controller');
// Get list of tasks
exports.index = function(req, res) {
    Task.find({}, '-__v', function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, tasks);
    });

};


exports.getMyAppliedTasks = function(req, res) {
    var currentUserId = req.session.userId;
    User.findOne({
        _id: currentUserId
    }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
        if (!user || err) return handleError(res, err);
        if (!user.otherTasks) return handleError(res, err);
        Task.find({
            '_id': {
                $in: user.otherTasks
            }
        }, function(err, tasks) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, tasks);
        });
    });
}

exports.countResponsibleTasks = function(req, res) {
    var currentUserId = req.session.userId;
    Task.count({
        'tasker.id': currentUserId,
        'status': {
            $ne: "completed"
        }
    }, function(err, count) {
        if (err) return handleError(res, err);
        return res.status(200).send("" + count);
    });
}

exports.getTasksResponsible = function(req, res) {
    var currentUserId = req.session.userId;
    Task.find({
        'tasker.id': currentUserId
    }, function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, tasks);
    });
}

exports.getMyTasks = function(req, res) {
        var currentUserId = req.session.userId;
        Task.find({
            'ownerId': currentUserId
        }, '-__v', function(err, tasks) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, tasks);
        });
    }
    // Get a single task
exports.show = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }
        return res.json(task);
    });
};
// Creates a new task in the DB.
exports.create = function(req, res) {
    var newTask = new Task(req.body);
    var currentUserId = req.session.userId;
    newTask.ownerId = currentUserId;
    User.findOne({
        _id: currentUserId
    }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
        if (err) return res.status(500).json(err);
        if (!user) return res.json(401);

        newTask.ownerName = user.name;
        newTask.ownerPic = user.pic;

        Task.create(newTask, function(err, task) {
            if (err) {
                return handleError(res, err);
            }
            user.myTasks.push(task._id);
            user.save(function(err) {
                if (err) {
                    console.log(err);
                    return handleError(res, err);
                }
                Notify.put(user._id, "MYTASK_CREATED", {
                    task: task.name,
                    name: user.name
                }, '/tasq/view/' + task._id.toString());
                return res.json(201, task);
            });
        });
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
        var updated = _.merge(task, req.body);
        var currentUserId = req.session.userId;
        updated.ownerId = currentUserId;
        User.findOne({
            _id: currentUserId
        }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
            if (err) return res.status(500).json(err);
            if (!user) return res.json(401);
            updated.ownerName = user.name;
            updated.ownerPic = user.pic;
            updated.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.json(200, task);
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
                return res.status(403).send("You do not own this task");
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
            if (item.id.equals(currentUserId))
                canApply = false;
        });
        if (!canApply) {
            return res.status(400).send("You already applied to help");
        } else {
            User.findOne({
                _id: currentUserId
            }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
                if (err) return res.status(500).json(err);
                if (!user) return res.json(401);
                if (user.fb && user.fb.id)
                    task.applicants.push({
                        id: user._id,
                        name: user.name,
                        pic: user.pic,
                        fbId: user.fb.id
                    });
                else
                    task.applicants.push({
                        id: user._id,
                        name: user.name,
                        pic: user.pic
                    });
                user.otherTasks.push(req.params.id);
                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return handleError(res, err);
                    }
                    task.save(function(err) {
                        if (err) {
                            return handleError(res, err);
                        }
                        return res.json(200, task);
                    });
                });
            });
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
    Task.findById(req.params.id, function(err, task) {
        var didApplicantApplyToTask = false;
        var chosenApplicantId = req.param('applicantId');
        if (chosenApplicantId != undefined) {
            _.each(task.applicants, function(item) {
                if (item.id.equals(chosenApplicantId))
                    didApplicantApplyToTask = true;
            });
            if (!didApplicantApplyToTask) {
                return res.status(500).send("This person is not applying for your task");
            }
        }
        if (chosenApplicantId == undefined) {
            task.tasker = {
                id: chosenApplicantId,
                confirmed: false
            };
            task.status = "open";
            task.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.status(200).json(task);
            });
        } else {

            User.findOne({
                _id: chosenApplicantId
            }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
                if (err) return res.status(500).json(err);
                if (!user) return res.json(401);
                if (user.fb && user.fb.id)
                    task.tasker = {
                        id: user._id,
                        name: user.name,
                        pic: user.pic,
                        fbId: user.fb.id,
                        confirmed: false
                    };
                else
                    task.tasker = {
                        id: user._id,
                        name: user.name,
                        pic: user.pic,
                        confirmed: false
                    };
                task.status = "chosen";
                task.save(function(err) {
                    if (err) {
                        return handleError(res, err);
                    }
                    //https://snaptasq.com/task/view/55c82438ede999467491c629
                    var taskUri = config.host.url + "task/view/" + task._id;
                    Emailer.sendRequestTaskerHelp(null, null, user.email, taskUri, task.name, task.ownerName, task.ownerPic);
                    return res.json(200, task);
                });
            });
        }

    });
};

/**
 * A chosen tasker must confirm that they can help
 * /:id/confirmTasker
 * @requires, the task must be have the caller as an applicant
 * @param id: taskId
 * @param isAccepted: true if they accepted, false if they rejected the task
 * If the user rejects the task, then the task is set to open, the applicant then
 * will be removed from the applicants
 **/
exports.confirmTasker = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }

        if (task.tasker.id == undefined) {
            return res.status(500).send("The owner has not yet picked a tasker");
        }
        // check for logged out
        if (!task.tasker.id.equals(req.session.userId)) {
            return res.status(403).send("You are not selected to help on this task.");
        } else {
            task.tasker.confirmed = req.param('isAccepted');
            if (task.tasker.confirmed) {
                task.status = "in progress";
            } else {
                task = removeApplicantFromTaskById(task, task.tasker.id);
                task.status = "open";
                task.tasker = undefined;
            }
            task.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.json(200, task);
            });
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

function isUserTasker(task, userId) {
    if (task.tasker.id == undefined)
        return false;
    return task.tasker.id.equals(userId);
}

function removeTasker(task) {
    task.tasker = undefined;
    task.status = "open";
    return task;
}

/**
 * Allowsa user to apply to help for a task
 **/
exports.unapplyToTask = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }
        var currentUserId = req.session.userId;
        User.findOne({
            _id: currentUserId
        }, '-salt -hashedPassword -verification.code -forgotPassCode -throttle', function(err, user) { // don't ever give out the password or salt
            if (err) return res.status(500).json(err);
            if (!user) return res.json(401);

            task = removeApplicantFromTaskById(task, user._id);
            for (var i = user.otherTasks.length - 1; i >= 0; i--) {
                if (user.otherTasks[i].equals(req.params.id)) {
                    user.otherTasks.splice(i, 1);
                }
            }

            user.save(function(err) {
                if (err) {
                    return handleError(res, err);
                }

                if (isUserTasker(task, user._id)) {
                    removeTasker(task);
                }
                task.save(function(err) {
                    if (err) {
                        return handleError(res, err);
                    }
                    return res.json(200, task);
                });
            });

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

function handleError(res, err) {
    return res.send(500, err);
}
