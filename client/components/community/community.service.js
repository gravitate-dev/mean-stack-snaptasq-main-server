/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('Community', function Community($resource, $http, $q) {

        var Comm = $resource('/api/communities/:id/:controller', {
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
                Comm.delete({
                    id: id
                }, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            create: function(data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.create({}, data, function(data) {
                    deferred.resolve(data);
                    if (cb)
                        return cb(data);
                });
                return deferred.promise;
            },
            getById: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getById({
                    id: id
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyAppliedTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getMyAppliedTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getMyTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            get: function(filter, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.get(filter, {}, function(data) {
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
                Comm.getTasksResponsible({}, {}, function(data) {
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
                Comm.confirmTasker({
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
                Comm.applyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            unapplyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.unapplyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            }
        };
    });
