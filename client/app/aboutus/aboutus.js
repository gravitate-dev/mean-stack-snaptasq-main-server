'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/about', {
                templateUrl: 'app/aboutus/aboutus.html',
                controller: 'AboutUsCtrl'
            });
    });
