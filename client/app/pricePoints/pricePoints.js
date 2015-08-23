'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/pricePoints', {
                templateUrl: 'app/pricePoints/pricePoints.html'
            });
    });
