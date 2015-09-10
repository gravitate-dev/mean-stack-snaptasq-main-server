'use strict';
angular.module('snaptasqApp')
    .controller('DebugCtrl', function($scope, Auth, _me, notifications, Community, Notification, FbCommunity, $timeout, $location) {
        $scope.friendFilter = "";
        $scope.items = [];
        _me.$promise.then(function(me) {
            $scope.items = me.friends;
        });

    });
