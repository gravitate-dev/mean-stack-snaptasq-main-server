'use strict';
angular.module('snaptasqApp').controller('ForgotCtrl', function($scope, vcRecaptchaService, User, Auth, notifications) {
    $scope.errors = {};

    $scope.resetCaptcha = function() {
        vcRecaptchaService.reload();
    };
    $scope.sendForgotPassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            $scope.submitted = false;
            Auth.sendForgotPasswordEmail(form.captchaResponse.$viewValue, form.email.$viewValue, function(success) {
                notifications.showSuccess({
                    message: 'Check your inbox! We sent you a reset password email to ' + $scope.email
                });
                $scope.resetCaptcha();
            }, function(fail) {
                $scope.resetCaptcha();
                if (fail.data.status && fail.data.status == "warn") notifications.showWarning({
                    message: fail.data.message
                });
                else notifications.showError({
                    message: fail.data.message
                });
                $scope.errors.other = fail.data.message
            });
        }
    }
});
