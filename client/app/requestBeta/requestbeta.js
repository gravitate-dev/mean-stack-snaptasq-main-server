'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/requestBeta', {
                templateUrl: 'app/requestBeta/requestbeta.html',
                controller: 'RequestBetaCtrl'
            });
    });
