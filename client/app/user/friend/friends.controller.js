'use strict';

angular.module('snaptasqApp')
    .controller('FriendCtrl', function($scope, User, Task, _me, $routeParams) {
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
        User.getById($scope.id, function(user) {
            if (angular.isUndefined(user)) {
                $scope.user = {};
                $scope.userDoesntExist = true;
            } else {
                $scope.user = user;
            }
        });

    })
    .controller('FriendsCtrl', function($scope, User, _me) {
        $scope.$watch("searchFriendName", _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.$apply(function() {
                // Code that does something based on $scope.id
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                $scope.searchForUsers(newvalue);
            })
        }, 1000));
        $scope.searchResults = [];
        $scope.searchForUsers = function(name) {
            User.searchByName(name, function(users) {
                if (angular.isUndefined(users)) {
                    $scope.searchResults = [];
                } else {
                    $scope.searchResults = users;
                }
            });
            console.log("Searching for users with name ", name);
        }
    });
