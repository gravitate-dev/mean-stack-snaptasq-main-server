/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('FbCommunity', function FbCommunity($resource, $http, $q) {
        var Comm = $resource('/api/fbcommunities/:id/:controller', {
            id: "@_id"
        }, {

        });

        return {
            joinByUrl: function(url, success, failure) {
                var failure = failure || angular.noop;
                var success = success || angular.noop;
                var deferred = $q.defer();

                $http({
                    method: "POST",
                    url: '/api/fbcommunities/joinByUrl',
                    data: {
                        url: url
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                    return success(response);
                }, function(fail) {
                    deferred.reject(fail);
                    return failure(fail);
                });
                return deferred.promise;
            },
        }
    })
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
            get: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: ""
                }
            },
            getTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "tasks"
                }
            },
        });
        return {
            getUserCommunties: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "GET",
                    url: '/api/communities/user/' + id
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return cb(response.data);
                });
                return deferred.promise;
            },
            searchByName: function(name, cb) {
                $http.post('/api/communities/search', {
                    name: name
                }).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    return cb(undefined);
                });
            },
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
            getTasksForGroupId: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getTasks({
                    id: id
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            get: function(filter, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.query(filter, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            isGroupOpen: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getById({
                    id: id
                }, function(response) {
                    if (!response) {
                        deferred.resolve(false);
                        return cb(false);
                    }
                    var data = (response.status == "public");
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            amIMember: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();

                $http.get('/api/communities/' + id + '/amIMember').then(function(response) {
                    deferred.resolve(response);
                    return cb(true);
                }, function(fail) {
                    deferred.reject(fail);
                    return cb(false);
                });
                return deferred.promise;
            },
            /**
             * A user can try to join a group
             * Will trigger success if the joining was accepted
             * Will trigger failure if the joining was rejected
             **/
            requestJoin: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http.post('/api/communities/' + id + '/requestJoin').success(function(data) {
                    deferred.resolve(response);
                    return cb(data);
                }).error(function(err) {
                    deferred.reject(fail);
                    return cb(undefined);
                });
                return deferred.promise;
            },

        };
    });
