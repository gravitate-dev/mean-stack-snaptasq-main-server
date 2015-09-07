'use strict';

angular.module('snaptasqApp')
    .factory('User', function($resource, $http) {
        var Usr = $resource('/api/users/:id/:controller', {
            id: '@_id'
        }, {
            applyBetaCode: {
                method: 'POST',
                params: {
                    controller: 'applyBetaCode'
                }
            },
            changePassword: {
                method: 'PUT',
                params: {
                    controller: 'password'
                }
            },
            resetChangePassword: {
                method: 'PUT',
                params: {
                    controller: 'resetChangePassword'
                }
            },
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            sendVerificationEmail: {
                method: 'POST',
                params: {
                    controller: 'sendVerificationEmail'
                }
            },
            sendForgotPasswordEmail: {
                method: 'POST',
                params: {
                    controller: 'sendForgotPasswordEmail'
                }
            },
            deleteMyAccount: {
                method: 'DELETE',
                params: {
                    controller: 'deleteMyAccount'
                }
            },
            get: {
                method: 'GET',
                params: {
                    id: 'me'
                }
            }
        });
        return {
            searchByName: function(name, cb) {
                var cb = cb || angular.noop;
                $http.post('/api/users/search', {
                    name: name
                }).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    return cb(undefined);
                });
            },
            getById: function(id, cb) {
                var cb = cb || angular.noop;
                $http.get('/api/users/' + id).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    console.error(err);
                    return cb(undefined);
                });
            },
            /**
             * Given a friend request I can accept a friend
             * If they are not my friends and they requested me
             * i can give both a userId who i want to friend
             * and a message id of the friend request as proof
             * that they sent a friend request to me
             **/
            addFriend: function(userId, messageId, cb, cbfail) {
                var cb = cb || angular.noop;
                var cbfail = cbfail || angular.noop;
                $http.post('/api/users/addFriend', {
                    id: userId,
                    messageId: messageId
                }).success(function(data) {
                    return cb(data);
                }).error(function(err) {
                    if (cbfail) {
                        return cbfail(err);
                    } else {
                        return cb("An error occured");
                    }
                });
            },
            get: Usr.get,
            applyBetaCode: Usr.applyBetaCode,
            changePassword: Usr.changePassword,
            resetChangePassword: Usr.resetChangePassword,
            create: Usr.create,
            sendVerificationEmail: Usr.sendVerificationEmail,
            sendForgotPasswordEmail: Usr.sendForgotPasswordEmail,
            deleteMyAccount: Usr.deleteMyAccount,
        }
    });
