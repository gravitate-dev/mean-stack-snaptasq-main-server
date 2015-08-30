'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/admin', {
                templateUrl: 'app/admin/admin.html',
                controller: 'AdminCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/users', {
                templateUrl: 'app/admin/users/admin.users.html',
                controller: 'AdminUsersCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/community', {
                templateUrl: 'app/admin/community/admin.community.html',
                controller: 'AdminCommunityCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/beta', {
                templateUrl: 'app/admin/beta/admin.beta.html',
                controller: 'AdminBetaCtrl',
                authenticate: true,
                adminRequired: true,
            });
    });
