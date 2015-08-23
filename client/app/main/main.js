'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl',
            });
    });
