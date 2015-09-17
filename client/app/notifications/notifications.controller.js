'use strict';
angular.module('snaptasqApp')
    .controller('NotificationsCtrl', function($scope, socket, $routeParams, _me, Notify) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.type = $routeParams.type;
        _me.$promise.then(function(me) {
            $scope._me = me;
            $scope.notifications = [];
            $scope.readNotificationsCount = undefined;
            Notify.get(function(notifications) {
                $scope.items = notifications;
                $scope.readNotificationsCount = notifications.length;
                socket.syncUpdates('notify', $scope.items);
            }, $scope.type);
        });
    })
