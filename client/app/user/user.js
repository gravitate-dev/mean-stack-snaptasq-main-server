'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/user/:id', {
                templateUrl: 'app/user/friend/friend.html',
                controller: 'FriendCtrl',
                authenticate: true
            })
            .when('/users/find', {
                templateUrl: 'app/user/friend/find.friends.html',
                controller: 'FriendsCtrl',
                authenticate: true
            });
    });
