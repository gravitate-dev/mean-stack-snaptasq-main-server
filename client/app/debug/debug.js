'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/debug', {
                templateUrl: 'app/debug/debug.html',
                controller: 'DebugCtrl',
            });
    });
