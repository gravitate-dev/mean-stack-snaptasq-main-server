'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/communities', {
                templateUrl: 'app/communities/communities.html',
                controller: 'CommunitiesCtrl',
                authenticate: true,
            });
    });
