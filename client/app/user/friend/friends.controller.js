'use strict';

angular.module('snaptasqApp')
    .controller('FriendCtrl', function($scope, $location, User, Task, UserMessage, Notification, Community, _me, $routeParams) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.id = $routeParams.id;
        $scope.user = {};
        $scope.communityFilter = {
            text: undefined
        };
        $scope.tasksFilter = {
            text: undefined
        };
        $scope.userDoesntExist = undefined;
        $scope.friendCommunities = [];
        $scope.friendTasks = [];
        $scope.isStranger == undefined;
        _me.$promise.then(function(me) {
            if ($scope.id == me._id) {
                $scope.isStranger = false;
            } else {
                var found = false;
                for (var i = 0; i < me.friends.length; i++) {
                    if (me.friends[i].id == $scope.id) {
                        found = true;
                        break;
                    }
                }
                $scope.isStranger = !found;
            }
            if ($scope.isStranger == false) {
                Task.getFriendTasks($scope.id, function(data) {
                    $scope.friendTasks = data;
                });
            }
            Community.getUserCommunties($scope.id, function(data) {
                if (data == undefined || data == null) {
                    $scope.friendCommunities = [];
                } else {
                    $scope.friendCommunities = data;
                }
            });
        });
        User.getById($scope.id, function(user) {
            if (angular.isUndefined(user)) {
                $scope.user = {};
                $scope.userDoesntExist = true;
            } else {
                $scope.userDoesntExist = false;
                $scope.user = user;
            }
        });


        $scope.addFriend = function(friend) {
            UserMessage.makeFriendRequest(friend._id, function(success) {
                Notification.success("Friend request sent to " + friend.name);
            }, function(fail) {
                Notification.warning("Friend request already sent to " + friend.name);
            })
        }

    })
    .controller('FriendsCtrl', function($scope, $location, User, UserMessage, _me, Notification) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.filter = {};
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
                        //console.log("You have given friends permission");
                    }
                });
            } else {
                $scope.connectedWithFacebook = false;
            }
        });

        $scope.addFriend = function($event, friend) {
            $event.stopPropagation();
            UserMessage.makeFriendRequest(friend._id, function(success) {
                Notification.success("Friend request sent to " + friend.name);
            }, function(fail) {
                Notification.warning("Friend request already sent to " + friend.name);
            })
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
