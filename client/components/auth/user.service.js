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
        return Usr;
    });
