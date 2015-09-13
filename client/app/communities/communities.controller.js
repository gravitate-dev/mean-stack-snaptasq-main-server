'use strict';
angular.module('snaptasqApp')
    .controller('CommunityJoinCtrl', function($scope, Auth, notifications, Community, Notification, FbCommunity, $timeout, $location) {
        $scope.freezeInput = false;
        $scope.noResults = false;
        $scope.searchResults = [];
        $scope.$watch("searchCommunity", function(newValue) {
            $scope.noResults = false;
        });
        $scope.$watch("searchCommunity", _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.$apply(function() {
                // Code that does something based on $scope.id
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                if ($scope.isurl_fb(newvalue) && !$scope._me.isConnectedWithFb) {
                    Notification.error("");
                    notifications.showError({
                        message: "you must first connect with facebook to join a facebook community. Go to your account to connect."
                    });
                    return;
                }
                $scope.searchForCommunities(newvalue);
            })
        }, 500));

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
                    if (angular.isUndefined(users) || _.isEmpty(users)) {
                        $scope.noResults = true;
                        $scope.searchResults = [];
                    } else {
                        $scope.noResults = false;
                        $scope.searchResults = users;
                    }
                });
            }
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
    }).controller('CommunitiesCtrl', function($scope, _me, Community, $http, $window, Auth, User, $location) {
        User.removeCache();
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.communityFilter = {};
        $scope.friendlistFilter = {};
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
    }).controller('CommunityCtrl', function($scope, Community, _me, Task, Auth, $routeParams, Notification, notifications) {
        $scope.id = $routeParams.id;
        $scope.allowed = undefined;
        $scope.taskFilter = {
            text: undefined
        };
        $scope.userFilter = {
            text: undefined
        };
        $scope.isMember = undefined;
        $scope.init = function() {

            //check to see if i am a member
            //if not check if the group is open
            Community.amIMember($scope.id, function(isMember) {
                $scope.isMember = isMember;
                if (isMember) {
                    $scope.allowed = true;
                } else {
                    Community.isGroupOpen($scope.id, function(isOpen) {
                        $scope.allowed = isOpen;
                    });
                }

            });
        }

        $scope.init();

        $scope.requestJoin = function(challenge, creds) {
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
    .controller('CommunityFriendCtrl', function($scope, _me, Community, Task, Auth, User, $routeParams, Notification, notifications) {
        //cant cache this as i get my friends!
        User.removeCache();
        $scope.group = {};
        _me.$promise.then(function(me) {
            $scope.group = {
                name: "my friends on snaptasq",
                users: me.friends,
                description: "These are your friends on snaptasq. Tasqs are automatically shared here to others"
            };
        });

        $scope.allowed = true;
        $scope.taskFilter = {
            text: undefined
        };
        $scope.userFilter = {
            text: undefined
        };
        $scope.isMember = true;
    });
