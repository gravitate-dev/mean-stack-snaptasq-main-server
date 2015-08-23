'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/admin/users', {
                templateUrl: 'app/admin/admin.html',
                controller: 'AdminCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/community', {
                templateUrl: 'app/admin/community/community.html',
                controller: 'AdminCommunityCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/beta', {
                templateUrl: 'app/admin/beta/beta.html',
                controller: 'AdminBetaCtrl',
                authenticate: true,
                adminRequired: true,
            });
    });
