'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
        /**
         * Sign in without action specified
         * Goes to login
         **/
            .when('/signin', {
                templateUrl: 'app/account/signin/signin.html',
                controller: 'SigninCtrl'
            })
            /**
             * Sign in,
             * action - login, register
             **/
            .when('/signin/:action', {
                templateUrl: 'app/account/signin/signin.html',
                controller: 'SigninCtrl',
                reloadOnSearch: false
            })
            .when('/connect', {
                templateUrl: 'app/account/connect/connect.html',
                controller: 'ConnectCtrl',
                authenticate: true
            })
            .when('/settings', {
                templateUrl: 'app/account/settings/settings.html',
                controller: 'SettingsCtrl',
                authenticate: true
            })
            .when('/forgot', {
                templateUrl: 'app/account/forgot/forgot.html',
                controller: 'ForgotCtrl',
            })
            .when('/resetPassword/:code1/:code2', {
                templateUrl: 'app/account/resetPassword/resetPassword.html',
                controller: 'ResetPasswordCtrl'
            })
            .when('/beta', {
                templateUrl: 'app/account/beta/beta.html',
                controller: 'BetaCtrl',
                authenticate: true
            })
            .when('/rewards', {
                templateUrl: 'app/account/rewards/rewards.html',
                controller: 'RewardsCtrl',
                authenticate: true
            })
            .when('/notifications', {
                templateUrl: 'app/account/notifications/notifications.html',
                controller: 'NotificationsCtrl',
                authenticate: true
            })
            .when('/inuse', {
                templateUrl: 'app/account/inuse/inuse.html',
            });
    });
