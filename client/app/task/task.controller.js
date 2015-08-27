'use strict';
angular.module('snaptasqApp')
    .controller('TasksCtrl', function($scope, _me, Page, notifications, Notification, $location, $window, $routeParams, Auth, Task, $timeout, $interval, User, TaskMock, KeyEventService, TaskMarshaler, Modal, $rootScope) {
        $scope.currentUrl = $location.absUrl();
        $scope._me = _me;
        //console.log(_me);
        $scope.action = $routeParams.action;
        $scope.id = $routeParams.id;
        $scope.errors = {};

        Page.setTitle("Create Tasq");
        $scope.loadTaskData = function() {
            if ($scope.id == undefined)
                return;
            Task.getById($scope.id, function(data) {
                $scope.task = data;
                $scope.task.locationCopy = _.clone(data.location, true);

                // change seo before we call ready
                //PageSeo.setTitle("Help out "+$scope.task.ownerName+ " with " + $scope.task.name);
                //PageSeo.setDescription($scope.task.description);
                $scope.htmlReady();

            }, function(err) {
                notifications.showError({
                    message: "This Task no longer exists. Because it was deleted by the owner."
                });
                $location.path('/tasks');
            });
        }
        $scope.$on('reloadTask', function() {
            if ($scope.id) {
                $scope.loadTaskData();
            }
        });

        $scope.task = {};
        var isNewTask = ($location.path().indexOf("create") != -1);
        if (isNewTask) {
            $scope.task = TaskMarshaler.getTask() || {};
        } else {
            //if we do have a non-default task but its not yet made we should
            //redirect them to the create
            if (TaskMarshaler.hasTask()) {
                $location.path('/task/create');
            }
            $scope.loadTaskData();
        }
        $scope.filter = {};
        //$scope.tasks = [];

        Task.countResponsibleTasks(function(count) {
            $rootScope.$broadcast('count.responsible', count);
        });
        $scope.typeTasks = $routeParams.type;
        if ($routeParams.type == "mine") {
            Task.getMyTasks(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else if ($routeParams.type == "applied") {
            Task.getMyAppliedTasks(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else if ($routeParams.type == "chosen") {
            Task.getTasksResponsible(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else {
            Task.get({}, function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        }

        $scope.connect = function() {
            $window.location.href = '/auth/facebook';
        };

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
            //check to see if i am in the task.applicants
            var result = false;
            _.each(task.applicants, function(item) {
                if (item.id == me._id) {
                    result = true;
                }
            });
            return result;

        }
        $scope.unapplyToTask = function(task) {
            if (!Auth.isLoggedIn()) {
                $scope.connect();
                //Notification.warning({message: "Task Saved. Please signup or login to publish your task."});
                //$location.path("/login");
            } else {
                Task.unapplyToTask({
                    id: task._id
                }, {}, function(data) {
                    if (task.tasker.id == $scope._me.id) {
                        Notification.success({
                            message: "You are no longer a helper for this task."
                        });
                    } else {
                        notifications.showSuccess("You are no longer listed as a helper for this task.");
                    }
                    task.applicants = data.applicants;
                    task.tasker = data.tasker;
                });
            }
        }

        $scope.deleteTask = function(t) {
            Modal.confirm.delete(function(data) {
                Task.delete(t._id, function(data) {
                    Notification.success({
                        message: "tasq delete",
                        delay: 4000
                    });
                    $location.path('/tasks/mine');
                }, function(err) {
                    notifications.showError(err);
                });
            })("this tasq");

        };
        $scope.applyToTask = function(task) {
                if (!Auth.isLoggedIn()) {
                    $scope.connect();
                    //Notification.warning({message: "Task Saved. Please signup or login to publish your task."});
                    //$location.path("/login");
                } else {
                    Task.applyToTask({
                        id: task._id
                    }, {}, function(data) {
                        task.applicants = data.applicants;
                        task.tasker = data.tasker;
                    });
                }
            }
            /**
             * A chosen tasker will confirm they will do the task
             * They will call this to set the tasker to confirm:true
             * Task status is closed
             **/
        $scope.taskerConfirmTask = function(task, isAccepted) {
            Task.confirmTasker(task._id, isAccepted, function(data) {
                if (isAccepted == false) {
                    $scope.$emit("removeTaskById", task._id);
                    Notification.success({
                        message: "You are no longer a helper for this task."
                    });
                } else {
                    Notification.success({
                        message: "You can now help them"
                    });
                }
                angular.copy(data, task);
            });
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
        //for (var i = 0; i < 50; i++) {
        //    $scope.xList.push(TaskMock.generate());
        //}
        /*
        $scope.myIsotope = angular.element('#isotopeContainer').scope();
        $scope.removeItem = function(index) {
            var s = angular.element('#isotopeContainer').scope();
            s.tasks.splice(index, 1);
            s.refreshIso();
            $scope.refreshIsotope();
        };
        $scope.selectedTask = undefined;
        $scope.refreshIsotope = function() {
            $timeout(function() {
                $scope.myIsotope.refreshIso();
            }, 1);
        }
        $scope.highlightItem = function($event, item) {
            if (!angular.isUndefined(item.selected) && item.selected==true){
                return;
            }
            if (!angular.isUndefined($scope.selectedTask)) {
                $scope.selectedTask.selected = false;
            }
            $scope.selectedTask = item;
            $scope.selectedTask.selected = true;
            $scope.refreshIsotope();
        };
        $scope.deselectCurrentItem = function() {
            if (angular.isUndefined($scope.selectedTask)) return;
            $scope.selectedTask.selected = false;
            $scope.refreshIsotope();
            $scope.refreshIsotope();
        }
        $scope.onCloseCommentBox = function(commentBox) {
            commentBox.selected = false;
            if (!angular.isUndefined($scope.selectedTask)) {
                $scope.selectedTask.selected = false;
            }
            $scope.refreshIsotope();
        }
        $scope.addToList = function() {
            var s = angular.element('#isotopeContainer').scope();
            s.count = s.count || 0;
            var newItem = {
                name: 'add',
                number: s.count--,
                date: Date.now(),
                class: 'purple'
            };
            s.tasks.push(newItem);
        }
        $interval(function() {
            //console.log("BEFORE");
            var s = angular.element('#isotopeContainer').scope();
            //console.log("AFTER");
            if (!angular.isUndefined(s) && !angular.isUndefined(s.refreshIso)){
                s.refreshIso();
                return;
            }
        }, 1000)
        */
    })
    .controller('TaskEditCtrl', function($scope, $window, Modal, notifications, $routeParams, Task, Notification, $rootScope, TaskMarshaler, Auth, $location) {
        $scope._bgcolorGrey();
        $rootScope.title = "Create Tasq";
        $scope.postTo = "PRIVATELY";
        /**
         * Task steps can be 
         * 1. taskform 2. community 3. share 4. finish
         **/
        $scope.uiStep = "taskform";
        $scope.taskId = undefined; // this will be set in Task.create
        $scope.changeStepTo = function(stepName) {
            if (stepName == "finish") {
                if ($scope.taskId) {
                    $location.path("/task/view/" + $scope.taskId);
                } else {
                    $location.path("/tasks/mine");
                }
            }
            $scope.uiStep = stepName;
        }

        $scope.timeEstimate = [{
            id: 1,
            name: '30 min'
        }, {
            id: 2,
            name: '1 hour'
        }, {
            id: 3,
            name: '2 hours'
        }, {
            id: 4,
            name: '>2 hours'
        }];


        //$scope.task = $scope.task || TaskMarshaler.getTask() || {};
        // if the $scope.task is undefined this means its coming from the homepage
        // in that case DO NOT reassign the varaible
        if (angular.isUndefined($scope.task)) {
            //ONLY load this if the task is undefined from the parent controller, TasksCtrl
            $scope.task = TaskMarshaler.getTask() || {};
        }
        $scope.$watch('_me', function(user) {
            if (angular.isUndefined(user)) {
                return;
            }
            if (user.requiresBeta && window._beta) {
                $location.path('/beta');
            }
        });
        // its okay if users are not logged in to go here
        // its not okay if users are logged in and have not unlocked the beta
        $scope.errors = {};
        $scope.action = $routeParams.action;

        $scope.previousLocation = {};

        //i have to watch the task
        var unregister = $scope.$watch('task', function(newVal, oldVal) {
                if (angular.isUndefined(newVal)) return;
                if (angular.isUndefined(newVal.location)) return;
                $scope.setEditor(newVal);
            })
            //case they edit a pre-existing location
        $scope.setEditor = function(task) {
            $scope.previousLocation = _.clone(task.location.name, true);
        }


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
                if ($scope.task.location.details || $scope.task.location.formattedName) {
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
        $scope.createTask = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                $scope.errors.location = undefined;
                try {
                    //if the formattedName is in
                    $scope.task.location = TaskMarshaler.formatLocation($scope.task.location);
                } catch (e) {
                    //if location is wrong simply invalidate the location
                    $scope.errors.location = true;
                }
                if ($scope.errors.description) {
                    return;
                }
                if (!Auth.isLoggedIn()) {
                    TaskMarshaler.setTask($scope.task);
                    notifications.showSuccess("Task Saved. Please signup or login to publish your task.");
                    $location.path("/signin");
                } else {
                    Task.create($scope.task,
                        function(data) {
                            var msg = undefined;
                            if ($scope.action == "update") {
                                msg = "Task updated.";
                            } else {
                                msg = "Task created.";
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
                                message: "Please login first."
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
