'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/notifications', {
                templateUrl: 'app/notifications/notifications.html',
                controller: 'NotificationsCtrl',
                authenticate: true,
            })
            .when('/notifications/:type', {
                templateUrl: 'app/notifications/notifications.html',
                controller: 'NotificationsCtrl',
                authenticate: true,
            });
    });
