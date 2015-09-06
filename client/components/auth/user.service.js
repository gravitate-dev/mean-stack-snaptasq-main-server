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
