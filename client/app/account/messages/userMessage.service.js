'use strict';

angular.module('snaptasqApp')
    .factory('UserMessage', function($resource, $http) {
        var UsrMsg = $resource('/api/userMessages/:id/:controller', {
            id: '@_id'
        }, {
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            getPrimary: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "getPrimary"
                }
            },
            getFriends: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "getFriends"
                }
            }
        });
        return {
            replyToMessage: function(id, reply, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                $http.post('/api/userMessages/' + id + '/reply', {
                    reply: reply
                }).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    if (cbfail) {
                        return cbfail(err);
                    } else {
                        return cb(undefined);
                    }
                });
            },
            getById: function(id, cb) {
                var cb = cb || angular.noop;
                $http.get('/api/userMessages/' + id).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    console.error(err);
                    return cb(undefined);
                });
            },
            getPrimary: function(offset, limit, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                UsrMsg.getPrimary({
                    offset: offset,
                    limit: limit
                }, {}, function(data) {
                    return cb(data);
                }, function(data) {
                    if (cbfail) {
                        return cbfail(data);
                    } else {
                        return cb(undefined);
                    }
                })
            },
            getFriends: function(offset, limit, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                UsrMsg.getFriends({
                    offset: offset,
                    limit: limit
                }, {}, function(data) {
                    return cb(data);
                }, function(data) {
                    if (cbfail) {
                        return cbfail(data);
                    } else {
                        return cb(undefined);
                    }
                })
            },
            delete: function(id, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                $http.delete('/api/userMessages/' + id).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    if (cbfail) {
                        return cbfail(err);
                    } else {
                        return cb(undefined);
                    }
                });
            },
            create: UsrMsg.create,
        }
    });
