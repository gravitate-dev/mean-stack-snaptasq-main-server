'use strict';
angular.module('snaptasqApp')
    .controller('TaskGlobalCtrl', function($scope, $route, Notification, notifications, $location, $window, $routeParams, Auth, Task, $timeout, $interval, User, TaskMock, KeyEventService, TaskMarshaler, Modal, $rootScope) {

        /**
         * _me is not needed, because i pass this in as a parameter from the view
         **/

        $scope.connect = function() {
            $window.location.href = '/auth/facebook';
        };


        $scope.canStartTask = function(task, me) {
            if (angular.isUndefined(me)) {
                return false;
            }
            if (task.ownerId == me._id)
                return false;

            // if its started then i cant start it again
            if (!angular.isUndefined(task.startTime))
                return false;
            //check to see if i am in the task.applicants
            if (!angular.isUndefined(task.tasker) && !angular.isUndefined(task.tasker.id)) {
                if (task.tasker.id == me._id) {
                    return true;
                }
            }
            return false;
        }
        $scope.canFinishTask = function(task, me) {
            if (angular.isUndefined(me)) {
                return false;
            }
            if (task.ownerId == me._id)
                return false;

            // if its started then i cant start it again
            if (!angular.isUndefined(task.endTime))
                return false;
            if (angular.isUndefined(task.startTime))
                return false;
            //check to see if i am in the task.applicants
            if (!angular.isUndefined(task.tasker) && !angular.isUndefined(task.tasker.id)) {
                if (task.tasker.id == me._id) {
                    return true;
                }
            }
            return false;
        }
        $scope.canApplyToTask = function(task, me) {
            if (angular.isUndefined(me)) {
                return true;
            }
            if (task.ownerId == me._id)
                return false;
            //check to see if i am in the task.applicants
            var result = true;
            _.each(task.applicants, function(item) {
                if (item.id == me._id) {
                    result = false;
                }
            });
            return result;
        }

        $scope.canUnapplyToTask = function(task, me) {
                if (angular.isUndefined(me)) {
                    return false;
                }
                if (task.ownerId == me._id)
                    return false;

                if (task.status == "completed")
                    return false;
                //check to see if i am in the task.applicants
                var result = false;
                _.each(task.applicants, function(item) {
                    if (item.id == me._id) {
                        result = true;
                    }
                });
                return result;

            }
            /**
             * Unapply is also used to quit a task
             **/
        $scope.unapplyToTask = function(task) {
            Task.unapplyToTask({
                id: task._id
            }, {}, function(data) {
                Notification.success({
                    message: "You are no longer a helper for this tasq.",
                    replaceMessage: true
                });
                task.applicants = data.applicants;
                task.tasker = data.tasker;
            });
        }

        $scope.deleteTask = function(t) {
            Modal.confirm.delete(function(data) {
                Task.delete(t._id, function(data) {
                    Notification.success({
                        message: "Tasq deleted.",
                        replaceMessage: true
                    });
                    $location.path('/tasqs');
                }, function(err) {
                    notifications.showError(err);
                });
            })("this tasq");

        };
        $scope.applyToTask = function(task) {
            if (!Auth.isLoggedIn()) {
                $scope.connect();
            } else {
                Task.applyToTask({
                    id: task._id
                }, {}, function(data) {
                    Notification.success({
                        message: "You have applied to help for this tasq.",
                        replaceMessage: true
                    });
                    $scope.task = data;
                    //task.applicants = data.applicants;
                    //task.tasker = data.tasker;
                });
            }
        };

        $scope.startTask = function(task) {
            Task.startTask(task._id, function(success) {
                Notification.success({
                    message: "You have started this tasq. To stop, click unapply.",
                    replaceMessage: true
                });

                $scope.task = success;
            }, function(fail) {
                Notification.error({
                    message: fail,
                    replaceMessage: true
                });
                $timeout(function() {
                    $window.location.reload();
                }, 2000)
            });
        }

        $scope.finishTask = function(task) {
            Modal.confirm.finishTask(function(data) {
                Task.finishTask(task._id, function(success) {
                    Notification.success({
                        message: "You have successfully completed the tasq.",
                        replaceMessage: true
                    });
                    $scope.task = success;
                }, function(fail) {
                    Notification.error({
                        message: fail,
                        replaceMessage: true
                    });
                    $timeout(function() {
                        $window.location.reload();
                    }, 2000)
                });
            })(task);
        }
        $scope.showApplicants = function(task) {
            Modal.view.applicants(function(data) {})(task);
        }

        KeyEventService.register($scope).escape(function() {
            //$scope.deselectCurrentItem();
        });

        $scope.$on('removeTaskById', function(event, id) {
            for (var i = $scope.tasks.length - 1; i >= 0; i--) {
                if ($scope.tasks[i]._id == id) {
                    $scope.tasks.splice(i, 1);
                }
            }
        });

        $scope.display = {
            mode: "list"
        };
    })
    .controller('TaskCtrl', function($scope, _me, notifications, $location, $window, $routeParams, Auth, Task, $timeout, $interval, User, TaskMock, KeyEventService, TaskMarshaler, Modal, $rootScope) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.currentUrl = $location.absUrl();
        _me.$promise.then(function(me) {
            $scope._me = _me;
        });

        $scope.action = $routeParams.action;
        $scope.id = $routeParams.id;
        $scope.errors = {};
        $scope.task = {};
        $scope.loadTaskData = function() {
            if ($scope.id == undefined)
                return;
            Task.getById($scope.id, function(data) {
                $scope.task = data;
                $scope.task.locationCopy = _.clone(data.location, true);

                // change seo before we call ready

            }, function(err) {
                notifications.showError({
                    message: "This tasq no longer exists, because it was deleted by the owner."
                });
                $location.path('/tasqs');
            });
        }
        $scope.$on('reloadTask', function() {
            if ($scope.id) {
                $scope.loadTaskData();
            }
        });
        $scope.loadTaskData();

    })
    .controller('TasksCtrl', function($scope, _me, notifications, Notification, $location, $window, $routeParams, Auth, Task, $timeout, $interval, User, TaskMock, KeyEventService, TaskMarshaler, Modal, $rootScope) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.currentUrl = $location.absUrl();
        $scope._me = _me;
        $scope.otherFilter = {};
        $scope.myTaskFilter = {
            text: ""
        };
    })
    .controller('TaskEditCtrl', function($scope, $window, Modal, notifications, $routeParams, Task, Notification, $rootScope, TaskMarshaler, Auth, $location) {
        $scope._noFooter();
        $scope._bgcolorGrey();
        $rootScope.title = "Create Tasq";
        $scope.postTo = "private";
        $scope.uiStep = "taskform";
        $scope.errors = {};
        $scope.previousLocation = {};
        $scope.action = $routeParams.action;
        $scope.id = $routeParams.id;
        //$scope.task = $scope.task || TaskMarshaler.getTask() || {};
        // if the $scope.task is undefined this means its coming from the homepage
        // in that case DO NOT reassign the varaible
        $scope.loadTaskData = function() {
            Task.getById($scope.id, function(data) {
                $scope.task = data;
                $scope.task.locationCopy = _.clone(data.location, true);
            }, function(err) {
                notifications.showError({
                    message: "This task no longer exists, because it was deleted by the owner."
                });
                $location.path('/tasqs');
            });
        }

        if (!angular.isUndefined($scope.id)) {
            $scope.loadTaskData();
        } else {
            $scope.task = TaskMarshaler.getTask() || {};
        }

        //protect against beta lock
        $scope.$watch('_me', function(user) {
            if (angular.isUndefined(user)) {
                return;
            }
            if (user.requiresBeta && window._beta) {
                $location.path('/beta');
            }
        });

        /**
         * When editing a task the newVal will NEVER be undefined
         * When creating a new task the newVal will be UNDEFINED
         * If the task was NOT UNDEFINED THEN SUDDENLY IS UNDEFINED
         * we should REMOVE ALL LOCATION PROPERTIES!
         * THIS FIXES LOCATION BUG!
         **/

        var isUndefinedFirst = false;
        var locationWatcher = $scope.$watch('task.location.name', function(newVal, oldVal) {
            if (newVal != oldVal) {
                if (angular.isUndefined($scope.task.location) || angular.isUndefined($scope.task.location.details) || $scope.task.location.details || $scope.task.location.formattedName) {
                    $scope.task.location = {
                        name: newVal
                    };
                    $scope.task.locationCopy = undefined;
                }
            }

        });

        if ($scope.action == "update") {
            /** 
             * Fix for task location not appearing when loading an old tasq
             **/
            var unregister = $scope.$watch('task', function(newVal, oldVal) {
                if (angular.isUndefined(newVal)) return;
                if (angular.isUndefined(newVal.location)) return;
                $scope.setEditor(newVal);
                unregister();
            })
        }

        //i have to watch the task
        //case they edit a pre-existing location
        $scope.setEditor = function(task) {
            if (task.location) {
                $scope.previousLocation = _.clone(task.location.name, true);
            } else {
                $scope.previousLocation = undefined;
            }
        }
        $scope.changeStepTo = function(stepName) {
            if (stepName == "finish") {
                if ($scope.taskId) {
                    $location.path("/tasq/view/" + $scope.taskId);
                } else {
                    $location.path("/tasqs");
                }
            }
            $scope.uiStep = stepName;
        }

        $scope.communitiesList = [{
            name: "Public Community 1",
            id: "55dfed9ed4c8c7fc27d3a2a9"
        }, {
            name: "Santa Clara University",
            id: "55dfde99741930e414618f3x"
        }, {
            name: "Santa Clara",
            id: "55dfde99741930e414618f3c"
        }, {
            name: "San Jose",
            id: "55dfde99741930e414618f3e"
        }, ];

        $scope.countEnabledCommunities = function(communities) {
            var count = 0;
            _.each(communities, function(item) {
                if (item.active)
                    count++;
            });
            return count;
        }

        $scope.uncheckAllCommunities = function(communities) {
            _.each(communities, function(item) {
                item.active = false;
            });
        }

        $scope.getCheckedCommunities = function(communities) {
            var checked = [];
            _.each($scope.communitiesList, function(item) {
                if (item.active)
                    checked.push({
                        id: item.id,
                        name: item.name
                    });
            });
            return checked;
        }

        $scope.showMoreCommunities = function() {
            Modal.view.pricePoints(function(data) {})();
        }


        $scope.createTask = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                /** If they dont put a location there is no error **/
                //if (!angular.isUndefined($scope.task.location) && !angular.isUndefined($scope.task.location.name) && !angular.isUndefined($scope.task.location.geo)) {
                try {
                    //if the formattedName is in
                    $scope.task.location = TaskMarshaler.formatLocation($scope.task.location);
                } catch (e) {
                    //if location is wrong simply invalidate the location
                    $scope.task.location = {};
                }
                /*} else {
                    $scope.task.location = undefined;
                }*/
                if ($scope.errors.description) {
                    return;
                }


                // now i need to set what groups the tasq is in

                $scope.task.communitiesIn = $scope.getCheckedCommunities($scope.communitiesList);
                if (!Auth.isLoggedIn()) {
                    TaskMarshaler.setTask($scope.task);
                    notifications.showSuccess("task saved. Please signup or login to publish your tasq.");
                    $location.path("/signin");
                } else {
                    Task.create($scope.task,
                        function(data) {
                            var msg = undefined;
                            if ($scope.action == "update") {
                                msg = "Tasq updated.";
                            } else {
                                msg = "Tasq created.";
                            }
                            $scope.taskId = data._id;
                            Notification.success({
                                message: msg,
                                delay: 4000
                            });
                            TaskMarshaler.setTask(undefined);
                            $scope.changeStepTo("finish");
                        },
                        function(fail) {
                            notifications.showError({
                                message: "Invalid fields for tasq"
                            });
                        });
                }
            } else {
                //console.log("form invalid");
            }
        }

        $scope.showPricePoints = function() {
            Modal.view.pricePoints(function(data) {})();
        }

        $scope.cancelEditingTask = function() {
            $scope.task = undefined;
            TaskMarshaler.removeTask();
            $window.history.back();
        }

    }).controller('TaskApplicantList', function($scope, Task, Notification, $rootScope) {
        $scope.setTasker = function(task, applicantId) {
            Task.setTasker(task._id, applicantId, function(data) {
                Notification.success({
                    message: "Your tasker has been chosen, and will be notified"
                });
                //task = angular.copy(data);
                //angular.copy(data,task);  //This will work as angular creates a deep copy
                //task = data; // this wont work at all
                task.tasker = data.tasker; // this will work as it assigns a property rather than the whole object
                task.status = data.status;
                $scope.success();
            }, function(data) {
                Notification.error({
                    message: data
                });
            });
        }
    }).filter('searchTaskFilter', function() {
        return function(tasks, filter) {
            var out = [];
            if (!angular.isUndefined(filter.text) && !_.isEmpty(filter.text) && filter.text.length > 2) {
                var searchableKeys = ['ownerName', 'name'];
                for (var i in tasks) {
                    for (var j in searchableKeys) {
                        var key = searchableKeys[j];
                        if (!angular.isUndefined(tasks[i][key])) {
                            var search = tasks[i][key].toLowerCase();
                            if (search.indexOf(filter.text.toLowerCase()) != -1) {
                                out.push(tasks[i])
                                break;
                            }
                            if (tasks[i].location) {
                                if (tasks[i].location.name.toLowerCase().indexOf(filter.text.toLowerCase()) != -1) {
                                    out.push(tasks[i])
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                out = tasks;
            }

            //filter for paid
            if (!angular.isUndefined(filter.paidOnly) && filter.paidOnly == true) {
                out = _.reject(out, function(el) {
                    return el.reward.money === false;
                });
            }
            // Filter logic here, adding matches to the out var.
            return out;
        }
    });
