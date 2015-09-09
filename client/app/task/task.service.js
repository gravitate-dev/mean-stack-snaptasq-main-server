/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('Task', function Task($resource, $http, $q) {

        var Tsk = $resource('/api/tasks/:id/:controller', {
            id: '@_id'
        }, {
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            update: {
                method: 'PUT',
                params: {
                    controller: ''
                }
            },
            getById: {
                method: 'GET',
                params: {
                    controller: ""
                }
            },
            getMyAppliedTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meApplied"
                }
            },
            getMyTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "me"
                }
            },
            get: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: ""
                }
            },
            getTasksResponsible: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meResponsible"
                }
            },
            setTasker: {
                method: 'POST',
                params: {
                    controller: "setTasker"
                }
            },
            confirmTasker: {
                method: 'POST',
                params: {
                    controller: "confirmTasker"
                }
            },
            applyToTask: {
                method: 'POST',
                params: {
                    controller: "apply"
                }
            },
            unapplyToTask: {
                method: 'POST',
                params: {
                    controller: "unapply"
                }
            }
        });
        return {
            delete: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.delete({
                    id: id
                }, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            create: function(data, cb, cbfail) {
                var cbfail = cbfail || angular.noop;
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.create({}, data, function(data) {
                    deferred.resolve(data);
                    if (cb)
                        return cb(data);
                }, function(failure) {
                    deferred.reject(failure);
                    if (cbfail) {
                        return cbfail(failure);
                    }
                });
                return deferred.promise;
            },
            getById: function(id, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                var deferred = $q.defer();
                Tsk.getById({
                    id: id
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                }, function(data) {
                    deferred.reject(data);
                    return cbfail(data);
                });
                return deferred.promise;
            },
            getMyFriendsTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http.get('/api/tasks/meFriends').success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    return cb(undefined);
                });
                return deferred.promise;
            },
            getMyAppliedTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getMyAppliedTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getMyTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            get: function(filter, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.get(filter, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            setTasker: function(id, applicantId, success, failure) {
                var success = success || angular.noop;
                var failure = failure || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "POST",
                    url: '/api/tasks/' + id + '/setTasker',
                    data: {
                        applicantId: applicantId
                    }
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return success(response.data);
                }, function(fail) {
                    deferred.reject(fail.data);
                    return failure(fail.data);
                });
                return deferred.promise;
            },
            /**
             * This will return all tasks where the user is the chosen tasker
             **/
            getTasksResponsible: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getTasksResponsible({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            countResponsibleTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "GET",
                    url: '/api/tasks/countResponsible'
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return cb(response.data);
                });
                return deferred.promise;
            },
            /** This can confirm to be a yes or no 
             * In the case where a tasker decides to not help
             * It will set the applicant to no one and confirm: false,
             * it will also email the task owner
             * @param id: The id of the task
             * @param isAccepted: false, if they dont want to help, true if they want to help
             * @param cb: a callback function
             **/
            confirmTasker: function(id, isAccepted, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.confirmTasker({
                    id: id,
                    isAccepted: isAccepted
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            applyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.applyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            unapplyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.unapplyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getFriendTasks: function(friendId, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "GET",
                    url: '/api/tasks/friends/' + friendId
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return cb(response.data);
                });
                return deferred.promise;
            },
        };
    })
    .factory('TaskMarshaler', function(localStorageService) {
        /**
         * This factory is used to send data between angularjs controllers
         * Where the data is a task. If theres no incoming data, this may be empty
         * This is a singleton
         **/
        var defaultTask = {
            name: undefined,
            location: {
                geo: {}
            },
            payout: 10.0
        };

        var setTask = function(t) {
            //this is only called when the task cant be posted yet
            localStorageService.set("savedTask", t);
        }

        /**
         * This is used in the main searchbox, it gives a prefilled task
         * That can be overrided
         **/
        var createDefaultTask = function(overRideTask) {
            var base = {
                name: undefined,
                location: {
                    geo: {}
                },
                payout: 10.0
            };
            return angular.extend(base, overRideTask);
        }

        var removeTask = function() {
            localStorageService.remove("savedTask");
            //localStorageService.clearAll();
        }
        var getTask = function() {
            return localStorageService.get("savedTask") || angular.copy(defaultTask);
        }
        var hasTask = function() {
            var task = getTask();
            if (angular.isUndefined(task) || angular.isUndefined(task.name))
                return false;
            return true;
        };

        var isLocationFormatted = function(location) {
            // if the task location has the property details,
            // that means it was changed, so the taskmarshaler
            // should reprocess the task location object!
            // even if theres already data stored.
            if (!angular.isUndefined(location.details)) {
                return false;
            }
            var hasFields = 1;
            hasFields &= !angular.isUndefined(location.name);
            hasFields &= !angular.isUndefined(location.formattedName);
            hasFields &= !angular.isUndefined(location.sname);
            hasFields &= !angular.isUndefined(location.geo);
            if (hasFields == 0) //to prevent a bug from accessing a field in an undefined
                return hasFields;
            hasFields &= !angular.isUndefined(location.geo.center);
            if (hasFields == 0) //to prevent a bug from accessing a field in an undefined
                return hasFields;
            hasFields &= !angular.isUndefined(location.geo.center.latitude);
            hasFields &= !angular.isUndefined(location.geo.center.longitude);
            hasFields &= !angular.isUndefined(location.geo.hash);
            hasFields &= !angular.isUndefined(location.place_id);
            hasFields &= !angular.isUndefined(location.url);
            hasFields &= !angular.isUndefined(location.vicinity);
            return hasFields;
        }


        /** This takes input of the { location.name location.details {} }
         * and will output the correct format for the schema
         **/
        var formatLocation = function(location) {
            if (isLocationFormatted(location))
                return location;
            var d = location.details || location;
            var latitude, longitude;
            try {
                latitude = location.details.geometry.location.lat();
                longitude = location.details.geometry.location.lng();
            } catch (err) {
                latitude = location.geo.center.latitude;
                longitude = location.geo.center.longitude;
            }
            var n = location.name;

            var address = d.formatted_address || d.formattedName;
            var vicin = d.vicinity || d.sname;
            var parsedLocation = {
                name: n,
                formattedName: address,
                geo: {
                    center: {
                        latitude: latitude,
                        longitude: longitude
                    },
                    hash: ngeohash.encode(latitude, longitude),
                },
                sname: d.name,
                place_id: d.place_id,
                url: d.url,
                vicinity: vicin
            };

            return parsedLocation;

        };
        //TODO: handle creating of tasks
        return {
            setTask: setTask,
            removeTask: removeTask,
            getTask: getTask,
            hasTask: hasTask,
            formatLocation: formatLocation,
            createDefaultTask: createDefaultTask,
        };
    })
    .factory('TaskMock', function() {
        function genName() {
            return chance.name();
        }

        function genId() {
            return Math.random().toString(36).substr(2, 5);
        }

        function genDate() {
            return chance.date({
                year: 2015,
                month: 4
            });
        }

        function generate() {

        }

        var generate = function() {
            if (Math.random() > 0.7) {
                return {
                    name: genName(),
                    number: genId(),
                    date: genDate(),
                    class: 'orange',
                    selected: false,
                    description: chance.paragraph()
                }
            } else {
                return {
                    name: genName(),
                    number: genId(),
                    date: genDate(),
                    class: 'blue',
                    selected: false,
                    description: chance.paragraph()
                }
            }
        }

        return {
            generate: generate
        };
    });
