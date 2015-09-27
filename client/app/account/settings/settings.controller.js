'use strict';
angular.module('snaptasqApp').controller('SettingsCtrl', function($scope, _me, Task, $window, $location, $timeout, Modal, User, Auth, notifications, Notification) {
    $scope.errors = {};
    $scope._bgcolorGrey();
    $scope._noFooter();
    $scope.userCanFbConnect = false;
    $scope.textNotificationEnable = undefined;
    $scope.$on('phoneVerified', function(data) {
        $scope.refreshMe();
    });
    _me.$promise.then(function(me) {
        $scope.userCanFbConnect = !_me.isConnectedWithFb;
        $scope._me = me;
        $scope.textNotificationEnable = me.phone.enableNotifications;
    });
    $scope.refreshMe = function() {
        User.removeCache();
        User.get(function(me) {
            $scope.userCanFbConnect = !_me.isConnectedWithFb;
            $scope._me = me;
            $scope.textNotificationEnable = me.phone.enableNotifications;
        });
    }
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
    $scope.changingNotificationSetting = false;
    $scope.toggleTextNotifications = function() {
        $scope.changingNotificationSetting = true;
        User.set("phone.enableNotifications", !$scope.textNotificationEnable, function(success) {
            $scope.changingNotificationSetting = false;
            $scope.textNotificationEnable = success;
        }, function(fail) {
            $scope.changingNotificationSetting = false;
            // do nothing
        });
    }
    $scope.showEnterPhoneNumber = function() {
        Modal.input.phoneNumberApplicant(function(data) {
            // called when the user clicks no thank you
            User.set("phone.ignorePrompt", true);
        })();
    }
});
