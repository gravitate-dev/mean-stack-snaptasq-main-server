'use strict';
angular.module('snaptasqApp')
    .controller('CommunityJoinCtrl', function($scope, Modal, Auth, notifications, Community, Notification, FbCommunity, $window, $timeout, $location, $route) {

        // when going to this from share tasq a modal is shown and it should be dismissed
        Modal.closeCurrent();
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
                    Notification.error("<a href='/settings'>You must first connect with facebook to join a facebook community. Go to your account to connect, here.</a>");
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
                /**
                 * When blank, i will search for my friends communities
                 * When not blank i will search by name
                 */
                if (_.isEmpty(name)) {
                    Community.myFriendsCommunities(function(data) {
                        if (angular.isUndefined(data) || data.length == 0) {
                            $scope.noResults = true;
                            $scope.searchResults = [];
                        } else {
                            $scope.noResults = false;
                            $scope.searchResults = _.filter(data, function(item) {
                                return item._id != undefined;
                            });
                        }
                    });
                } else {
                    Community.searchByName(name, function(data) {
                        if (angular.isUndefined(data) || _.isEmpty(data)) {
                            $scope.noResults = true;
                            $scope.searchResults = [];
                        } else {
                            $scope.noResults = false;
                            $scope.searchResults = _.filter(data, function(item) {
                                return item._id != undefined;
                            });
                        }
                    });
                }
            }
        }

        Community.myFriendsCommunities(function(data) {
            if (angular.isUndefined(data) || data.length == 0) {
                $scope.noResults = true;
                $scope.searchResults = [];
            } else {
                $scope.noResults = false;
                $scope.searchResults = _.filter(data, function(item) {
                    return item._id != undefined;
                });
            }
        });

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
                            }, 100);
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
        $scope.taskFilter = {};
        $scope.friendlistFilter = {};
        _me.$promise.then(function(me) {
            $scope._me = me;
        });

    })
    .controller('CommunityFacebookConnect', function($scope, _me, $http, Auth, $window) {
        $scope.reconnect = function() {
            $window.location.href = '/auth/facebook/reauth';
        };
    }).controller('CommunityCtrl', function($scope, $timeout, Community, _me, Task, Auth, $routeParams, Notification, notifications, Modal) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.id = $routeParams.id;
        _me.$promise.then(function(me) {
            $scope._me = me;
        });
        $scope.allowed = undefined;
        $scope.taskFilter = {
            text: undefined
        };
        $scope.userFilter = {
            text: undefined
        };
        $scope.isMember = undefined;
        $scope.init = function() {
            Community.getById($scope.id, function(item) {
                $scope.group = item;
            });
            //check to see if i am a member
            //if not check if the group is open
            Community.amIMember($scope.id, function(isMember) {
                $scope.isMember = isMember;
                Community.isGroupOpen($scope.id, function(isOpen) {
                    if (isMember || isOpen) {
                        $scope.allowed = true;
                    } else {
                        $scope.allowed = false;
                    }
                });
            });
        };

        $scope.init();


        $scope.requestJoin = function() {
            if (angular.isUndefined($scope._me)) {
                return Notification.error({
                    message: "Please login first",
                    replaceMessage: true
                });
            }
            if ($scope.group.source == 'facebook' && !$scope._me.isConnectedWithFb) {
                return Notification.error({
                    message: "To join this group you must connect your account with facebook in your <a href='/settings' style='text-decoration: underline;color: #0000EE;'>account settings.</a>",
                    replaceMessage: true
                });
            }
            Community.requestJoin($scope.group._id, $scope.group.source, function(success) {
                Notification.success({
                    message: "You have successfully joined the group.",
                    replaceMessage: true
                });
                $scope.init();
            }, function(fail) {
                if ($scope.group.url) {
                    Notification.warning({
                        message: "You must first join the group on facebook first. <a style='text-decoration:underline;color: #0000EE;' href='" + $scope.group.url + "' target='_tab'>Here is a link</a>",
                        replaceMessage: true
                    });
                } else {
                    Notification.error({
                        message: "Sorry, you can not join this group.",
                        replaceMessage: true
                    });
                }
            })
        }

        $scope.requestLeave = function() {
            Modal.confirm.leaveGroup(function(data) {
                Community.requestLeave($scope.group._id, function(success) {
                    Notification.success({
                        message: "You have successfully left the group.",
                        replaceMessage: true
                    });
                    $scope.init();
                }, function(fail) {
                    Notification.error(fail);
                });
            })($scope.group);
        }


    })
    .controller('CommunityFriendCtrl', function($scope, _me, Community, Task, Auth, User, $routeParams, Notification, notifications) {
        //cant cache this as i get my friends!
        $scope._bgcolorGrey();
        $scope._noFooter();
        User.removeCache();
        $scope.group = {};
        _me.$promise.then(function(me) {
            $scope._me = me;
            $scope.myId = me._id; //this is used by the Embedded Notificatons Ctrl
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
