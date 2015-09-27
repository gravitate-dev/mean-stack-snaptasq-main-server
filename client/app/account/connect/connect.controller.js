'use strict';

angular.module('snaptasqApp')
    .controller('ConnectCtrl', function($scope, Auth, $location, $timeout, User, $window, $http, notifications) {
        $scope.user = {};
        $scope.errors = {};

        $scope.currentUser = {};
        /**
         * If the user is both verified and connected with facebook this page will be blank
         * Its best to redirect them to the tasks!
         **/
        var temp = new User(Auth.getCurrentUser());
        temp.$promise.then(function(data) {
            if (data.isConnectedWithFb && data.verification.status) {
                $location.path('/tasqs');
            }
            $scope.currentUser = data;
        });

        //maybe a wierd race condition?
        $timeout(function() {
            var temp = new User(Auth.getCurrentUser());
            temp.$promise.then(function(data) {
                if (data.isConnectedWithFb && data.verification.status) {
                    $location.path('/tasqs');
                }
                $scope.currentUser = data;
            });
        }, 1000)

        $scope.sendVerificationEmail = function(form) {
            User.sendVerificationEmail(form.captchaResponse.$viewValue, function(success) {
                notifications.showSuccess({
                    message: 'Sent. Please check your inbox, ' + $scope.currentUser.email
                });
                grecaptcha.reset();
            }, function(fail) {
                //TODO: When email fails handle the case
                if (fail.data.status && fail.data.status == "warn")
                    notifications.showWarning({
                        message: fail.data.message
                    });
                else
                    notifications.showError({
                        message: fail.data.message
                    });
            });
        }
        $scope.connect = function() {
            $window.location.href = '/auth/facebook';
        };
    });
