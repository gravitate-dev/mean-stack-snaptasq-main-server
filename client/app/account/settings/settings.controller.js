'use strict';
angular.module('snaptasqApp').controller('SettingsCtrl', function($scope, _me, Task, $window, $location, $timeout, Modal, User, Auth, notifications, Notification) {
    $scope.errors = {};
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
    $scope.userCanFbConnect = false;

    _me.$promise.then(function(me) {
        $scope.userCanFbConnect = !_me.isConnectedWithFb;
        $scope._me = me;
    });

    $scope.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };

    $scope.showDeleteAccountModal = function() {
        Modal.confirm.delete(function(data) {
            Auth.deleteMyAccount(function(data) {
                notifications.showSuccess({
                    message: 'Your account has been deleted.'
                });
                $timeout(function() {
                    $window.location.reload();
                }, 2000)
            }, function(data) {
                notifications.showError({
                    message: 'Please login again first to delete.'
                });
            });
        })("your account");

    };
    $scope.changePassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword).then(function() {
                Notification.success({
                    message: 'Password successfully changed.',
                    replaceMessage: true
                });
                $scope.submitted = false;
                $scope.user.oldPassword = "";
                $scope.user.newPassword = "";
                form.$setPristine();
            }).
            catch(function() {
                form.password.$setValidity('mongoose', false);
                $scope.errors.other = 'Incorrect password';
                $scope.message = '';
            });
        }
    };

    $scope.sendForgotPassword = function(form) {
        Auth.sendVerificationEmail(form.captchaResponse.$viewValue, function(success) {
            notifications.showSuccess({
                message: 'Check your inbox! We sent you a reset password email to ' + $scope._me.email
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
});
