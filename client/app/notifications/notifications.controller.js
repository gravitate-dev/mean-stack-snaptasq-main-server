'use strict';
angular.module('snaptasqApp')
    .controller('NotificationsCtrl', function($scope, socket, $routeParams, _me, Notify) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.type = $routeParams.type;
        $scope.myId = undefined;

        /* This sets the filter i use for my notifications */
        $scope.setType = function(type) {
            $scope.type = type;
        }
        _me.$promise.then(function(me) {
            $scope._me = me;
            $scope.myId = me._id;
            $scope.notifications = [];
            $scope.readNotificationsCount = undefined;
            Notify.get(function(notifications) {
                $scope.items = notifications;
                $scope.readNotificationsCount = notifications.length;
                socket.syncUpdates('notify', $scope.items);
            }, $scope.type);
        });



        $scope.refreshNotifications = function() {
            Notify.get(function(notifications) {
                $scope.items = notifications;
                $scope.readNotificationsCount = notifications.length;
            }, $scope.type);
        }
        $scope.hideNotification = function($event, item) {
            $event.stopPropagation();
            Notify.hideNotification(item._id, function(data) {
                $scope.refreshNotifications();
            });
        }

        /*    $scope.hideAllNotifications = function(){
                _.each($scope.items, function(item){
                    if (item.ty)
                    Notify.hideNotification(item._id, function(data) {
                        $scope.refreshNotifications();
                    });
                });
            }*/

        $scope.$on("$destroy", function() {
            socket.unsyncUpdates('notify');
        });
    }).controller('NotificationsEmbeddedCtrl', function($scope, socket, $routeParams, Notify) {
        $scope._bgcolorGrey();
        $scope._noFooter();
        $scope.type = $routeParams.type;

        /* This sets the filter i use for my notifications */
        $scope.setType = function(type) {
            $scope.type = type;
        }
        $scope.notifications = [];
        $scope.readNotificationsCount = undefined;
        Notify.get(function(notifications) {
            $scope.items = notifications;
            $scope.readNotificationsCount = notifications.length;
            socket.syncUpdates('notify', $scope.items);
            //$scope.setupListener();
        }, $scope.type);

        $scope.refreshNotifications = function() {
            Notify.get(function(notifications) {
                $scope.items = notifications;
                $scope.readNotificationsCount = notifications.length;
            }, $scope.type);
        }
        $scope.hideNotification = function($event, item) {
            $event.stopPropagation();
            Notify.hideNotification(item._id, function(data) {
                $scope.refreshNotifications();
            });
        }

        $scope.$on("$destroy", function() {
            socket.unsyncUpdates('notify');
        });
    })
