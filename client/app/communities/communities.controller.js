'use strict';
angular.module('snaptasqApp')
    .controller('CommunityJoinCtrl', function($scope, Auth, Community, Notification, FbCommunity, $timeout, $location) {
        $scope.freezeInput = false;
        $scope.searchResults = [];
        $scope.$watch("searchCommunity", _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.$apply(function() {
                // Code that does something based on $scope.id
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                if ($scope.isurl_fb(newvalue) && !$scope._me.isConnectedWithFb) {
                    console.error("you must first connect with facebook to join a facebook community");
                    return;
                }
                $scope.searchForCommunities(newvalue);
            })
        }, 1000));

        $scope.isurl_fb = function(url) {
            if (angular.isUndefined(url)) {
                return false;
            }
            if (url.indexOf("facebook") != -1 && url.indexOf(".com") != -1) {
                return true;
            }
            return false;
        }
        $scope.searchForCommunities = function(name) {
            if ($scope.isurl_fb(name)) {
                $scope.joinFacebookUrl(name);
            } else {
                Community.searchByName(name, function(users) {
                    if (angular.isUndefined(users)) {
                        $scope.searchResults = [];
                    } else {
                        $scope.searchResults = users;
                    }
                });
            }
            console.log("Searching for users with name ", name);
        }

        $scope.joinFacebookUrl = function(url) {
            $scope.freezeInput = true;
            try {
                if ($scope.isurl_fb(url)) {
                    FbCommunity.joinByUrl(url, function(success) {
                        if (angular.isString(success.data)) {
                            $scope.freezeInput = false;
                            Notification.success(success.data);
                        } else {
                            var comm = success.data;
                            Notification.success("Welcome to " + comm.name + "'s snaptasq community!");
                            $timeout(function() {
                                $scope.freezeInput = false;
                                $location.path('/community/view/' + comm._id);
                            }, 2000);
                        }
                    }, function(failure) {
                        $scope.freezeInput = false;
                        Notification.error(failure.data);
                    })
                }
            } catch (e) {
                $scope.error = e;
                $scope.freezeInput = false;
                Notification.error(e);
            }
        }
    }).controller('CommunitiesCtrl', function($scope, _me, Community, $http, $window, Auth, $location) {
        //$scope._bgcolorSnapYellow();
        $scope._bgcolorGrey();
        $scope._noFooter();
        _me.$promise.then(function(me) {
            $scope.communities = me.groups;
        });
        /*
        Auth.hasFacebookPermission('user_friends',function(hasPermission){
            console.log(hasPermission);
            if (!hasPermission){
                $location.path('/communities/permission');
            }
        });
*/

    })
    .controller('CommunityFacebookConnect', function($scope, _me, $http, Auth, $window) {
        $scope.reconnect = function() {
            $window.location.href = '/auth/facebook/reauth';
        };
    }).controller('CommunityCtrl', function($scope, Community, Task, Auth, $routeParams, Notification, notifications) {
        $scope.groupId = $routeParams.id;
        $scope.allowed = undefined;
        $scope.tasks = [];
        $scope.filter = {};
        //getMyFriendsTasks


        $scope.init = function() {
            /**
             * First check if the group is public
             **/
            Community.isGroupOpen($scope.groupId, function(isOpen) {
                if (!isOpen) {
                    /**
                     * If the group is not public, then see if i am a member
                     **/
                    Auth.isUserInGroupAsync($scope.groupId, function(isAllowed) {
                        $scope.allowed = isAllowed;
                        $scope.loadGroupDetails($scope.groupId);
                    });
                } else {
                    $scope.allowed = true;
                    $scope.loadGroupDetails($scope.groupId);
                }
            });
        }

        $scope.init();
        $scope.loadGroupDetails = function(groupId) {
            Community.getById(groupId, function(item) {
                $scope.group = item;
            });
            Community.getTasksForGroupId(groupId, function(item) {
                $scope.tasks = item;
            });
        };

        $scope.requestJoin = function(challenge, creds) {
            console.log(challenge);
            Community.requestJoin($scope.groupId, $scope._me._id, challenge.id, creds, function(success) {
                if (challenge.type == "email") {
                    notifications.showSuccess("Please check your email for an emailed join link");
                } else if (challenge.type == "areacode") {
                    notifications.showSuccess("Please check your phone for a texted join link");
                } else {
                    notifications.showSuccess("Welcome to the group");
                }
            }, function(fail) {
                Notification.error(fail.data);
            })
        }
    })
    .controller('CommunityFriendCtrl', function($scope, Community, Task, Auth, $routeParams, Notification, notifications) {
        $scope.tasks = [];
        $scope.filter = {};
        Task.getMyFriendsTasks(function(data) {
            if (angular.isUndefined(data)) {
                console.error("No tasks found");
            } else {
                $scope.tasks = data;
            }
        });
    });
