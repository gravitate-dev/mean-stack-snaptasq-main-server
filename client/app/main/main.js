'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/mainlandingemail.html',
                controller: 'MainCtrl',
            });
    });
