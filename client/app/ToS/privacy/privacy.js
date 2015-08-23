'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/privacy', {
                templateUrl: 'app/ToS/privacy/privacy.html',
                controller: 'PrivacyCtrl'
            });
    });
