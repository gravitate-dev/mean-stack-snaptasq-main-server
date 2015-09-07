'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/messages', {
                templateUrl: 'app/account/messages/userMessages.html',
                controller: 'UserMessagesCtrl',
                authenticate: true,
            })
            .when('/newmessage', {
                templateUrl: 'app/account/messages/new.userMessage.html',
                controller: 'UserMessageCtrl',
                authenticate: true,
            })
            .when('/message/:id', {
                templateUrl: 'app/account/messages/userMessage.html',
                controller: 'UserMessageCtrl',
                authenticate: true,
            });
    });
