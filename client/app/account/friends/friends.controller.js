'use strict';

angular.module('snaptasqApp')
    .controller('FriendCtrl', function($scope, Beta, Auth, Task, _me, $routeParams) {
        $scope.id = $routeParams.id;
        $scope.user = {};
        $scope.userDoesntExist = false;

        _me.$promise.then(function(me) {
            var found = false;
            for (var i = 0; i < me.friends.length; i++) {
                if (me.friends[i].id == $scope.id) {
                    found = true;
                    break;
                }
            }
            $scope.isStranger = !found;
            if ($scope.isStranger == false) {
                Task.getFriendsTasks($scope.id, function(data) {
                    $scope.friendTasks = data;
                });
            }
        });
        Auth.getById($scope.id, function(user) {
            if (angular.isUndefined(user)) {
                $scope.user = {};
                $scope.userDoesntExist = true;
            } else {
                $scope.user = user;
            }
        });

    })
    .controller('FriendsCtrl', function($scope, Beta, User, _me) {

    });
