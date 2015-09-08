'use strict';

angular.module('snaptasqApp')
    .controller('FriendCtrl', function($scope, $location, User, Task, _me, $routeParams) {
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
    .controller('FriendsCtrl', function($scope, $location, User, UserMessage, _me, Notification) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.freezeInput = false;
        $scope.searching = false;
        $scope.searchResults = [];
        $scope.noResults = false;
        $scope.connectedWithFacebook = true;
        _me.$promise.then(function(me) {
            if (me.isConnectedWithFb == true) {
                User.hasFacebookPermission("user_friends", function(hasPermission) {
                    if (!hasPermission) {
                        $location.path('/communities/permission');
                    } else {
                        console.log("You have given friends permission");
                    }
                });
            } else {
                $scope.connectedWithFacebook = false;
            }
        });
        $scope.sendFriendRequest = function($event, id) {
            $event.stopPropagation();
            UserMessage.makeFriendRequest(id, function(success) {
                Notification.success("Friend request sent to their inbox");
            }, function(fail) {
                //check if friends
                if ($scope.notFriendsYet(id)) {
                    Notification.error("Friend request already sent.");
                } else {
                    Notification.success("You are already friends");
                }

            });
        }

        $scope.notFriendsYet = function(otherPersonsId) {
            for (var i = 0; i < $scope._me.friends.length; i++) {
                if ($scope._me.friends[i].id == otherPersonsId) {
                    return false;
                }
            }
            return true;
        }

        $scope.$watch("searchFriendName", _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.searching = true;
            $scope.noResults = false;
            $scope.$apply(function() {
                // Code that does something based on $scope.id
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                $scope.searchForUsers(newvalue);
            })
        }, 500));
        $scope.$watch('searchFriendName', function(newval) {
            if (angular.isUndefined(newval) || _.isEmpty(newval)) {
                $scope.searching = false;
            } else {
                $scope.searching = true;
            }
        });
        $scope.searchResults = [];
        $scope.searchForUsers = function(name) {
            User.searchByName(name, function(users) {
                $scope.searching = false;
                if (angular.isUndefined(users) || _.isEmpty(users)) {
                    $scope.noResults = true;
                    $scope.searchResults = [];
                } else {
                    $scope.searchResults = users;
                }
            });
        }
    });
