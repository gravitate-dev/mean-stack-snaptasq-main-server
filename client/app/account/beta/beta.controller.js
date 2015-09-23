'use strict';

angular.module('snaptasqApp')
    .controller('BetaCtrl', function($scope, BadgeAlerts, _me, $window, $interval, $location, $timeout, Beta, User, notifications, Notification, moment) {
        $scope.buttonDisable = false;
        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.errors = {};
        $scope.betaCode = "";
        _me.$promise.then(function(me) {
            if (!me.requiresBeta) {
                $location.path('/tasqs');
            }
        });

        $scope.checkbeta = function(form) {

            User.applyBetaCode(form.betaCode.$viewValue, function(success) {
                notifications.showSuccess({
                    message: success
                });
                BadgeAlerts.remove(BadgeAlerts.MISSING_BETA_CODE);

                $timeout(function() {
                    $window.location.reload();
                }, 1000);
            }, function(error) {
                Notification.error(error);
            });
        }
    });
