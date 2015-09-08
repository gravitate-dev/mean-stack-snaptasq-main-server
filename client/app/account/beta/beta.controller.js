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

            User.applyBetaCode({}, {
                id: form.betaCode.$viewValue
            }, function(success) {
                notifications.showSuccess({
                    message: success.message
                });
                BadgeAlerts.remove(BadgeAlerts.MISSING_BETA_CODE);

                $timeout(function() {
                    $window.location.reload();
                }, 1000);
            }, function(error) {
                if (error.status == 429) {
                    //rate limit
                    $scope.buttonDisable = true;
                    $timeout(function() {
                        $scope.buttonDisable = false;
                    }, 10000);

                }
                Notification.error(error.data);
            });
        }
    });
