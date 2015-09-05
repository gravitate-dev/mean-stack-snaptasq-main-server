'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/communities', {
                templateUrl: 'app/communities/communities.html',
                controller: 'CommunitiesCtrl',
                authenticate: true,
            })
            .when('/communities/permission', {
                templateUrl: 'app/communities/communities.permission.html',
                controller: 'CommunityFacebookConnect',
                authenticate: true,
            })
            .when('/communities/join', {
                templateUrl: 'app/communities/join.community.html',
                controller: 'CommunityJoinCtrl',
                authenticate: true,
            })
            .when('/community/view/:id', {
                templateUrl: 'app/communities/community.html',
                controller: 'CommunityCtrl',
                authenticate: true,
            })
            .when('/community/friends', {
                templateUrl: 'app/communities/friend.community.html',
                controller: 'CommunitiesCtrl',
                authenticate: true,
            });
    });
