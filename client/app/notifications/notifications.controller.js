'use strict';
angular.module('snaptasqApp')
    .controller('NotificationsCtrl', function($scope, $routeParams, Notify) {
        $scope.type = $routeParams.type;
        $scope.items = [];
        $scope.getNotifications = function() {
            Notify.get(function(notifications) {
                $scope.items = notifications;
            }, $scope.type);
        }
        $scope.getNotifications();

    })
