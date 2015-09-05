'use strict';
angular.module('snaptasqApp')
    .controller('CommunityJoinCtrl', function($scope, Auth, Community, Notification, FbCommunity, $timeout, $location) {
        $scope.submitted = false;
        $scope.error = undefined;
        $scope.testFb = function(query) {
            Auth.test(query);
        }

        $scope.testFbPost = function(query) {
            Auth.testPost(query);
        }

        $scope.isurl_fb = function(url) {
            if (angular.isUndefined(url))
                return false;
            if (url.indexOf("facebook") != -1) {
                return true;
            }
            return false;
        };
        $scope.validateUrl = function(url) {
            /** Facebook **/
            if ($scope.isurl_fb(url) && !$scope._me.isConnectedWithFb) {
                throw "To join a facebook community, you need to connect your account with facebook first";
            }
            return true;
        }
        $scope.processJoinUrl = function(form) {
            $scope.submitted = true;
            if (form.$valid) {

                //console.log(form.url.$viewValue);
                try {
                    var url = form.url.$viewValue;
                    $scope.validateUrl(form.url.$viewValue);
                    if ($scope.isurl_fb(url)) {
                        FbCommunity.joinByUrl(url, function(success) {
                            if (angular.isString(success.data))
                                Notification.success(success.data);
                            else {
                                var comm = success.data;
                                Notification.success("Welcome to " + comm.name + "'s snaptasq community!");
                                $timeout(function() {
                                    $location.path('/community/view/' + comm._id);
                                }, 2000);
                            }
                        }, function(failure) {
                            Notification.error(failure.data);
                        })
                    }
                    //Community.joinWithUrl(form.$)    
                } catch (e) {
                    $scope.error = e;
                    Notification.error(e);
                }
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
    }).controller('CommunityCtrl', function($scope, Community, Auth, $routeParams, Notification, notifications) {
        $scope.groupId = $routeParams.id;
        $scope.allowed = undefined;
        $scope.tasks = [];
        $scope.filter = {};

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
    });
