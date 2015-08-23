'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/terms', {
                templateUrl: 'app/ToS/terms/terms.html',
                controller: 'TermsCtrl'
            });
    });
