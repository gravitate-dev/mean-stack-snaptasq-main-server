'use strict';
angular.module('snaptasqApp').controller('NotificationsCtrl', function($scope, Notify, $interval) {
    $scope.notifications = [];
    $interval(function() {
        Notify.get(function(notifications) {
            $scope.notifications = notifications;
        });
    }, 5000);
    Notify.get(function(notifications) {
        $scope.notifications = notifications;
    });

});
