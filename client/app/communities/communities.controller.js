'use strict';
angular.module('snaptasqApp').controller('CommunitiesCtrl', function($scope, Community, $http, $window) {
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
    $scope.communities = [];
    $scope.showSuggestCommunityModal = function() {

    };


    $scope.listCommunities = function() {
        Community.get({}, function(data) {
            $scope.communities = [];
            _.each(data, function(item) {
                $scope.communities.push(item);
            });
        });
    }
    $scope.listCommunities();
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
