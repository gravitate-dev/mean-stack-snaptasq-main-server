'use strict';
angular.module('snaptasqApp').controller('ResetPasswordCtrl', function($scope, $timeout, User, Auth, notifications, $routeParams) {
    $scope.errors = {};
    $scope.resetCode1 = "";
    $scope.resetCode2 = "";
    if (angular.isUndefined($routeParams.code1) || angular.isUndefined($routeParams.code2)) {
        notifications.showError({
            message: "Invalid change password link. Check your email again."
        });
        $scope.message = "Invalid change password link. Check your email again.";
    } else {
        $scope.resetCode1 = $routeParams.code1;
        $scope.resetCode2 = $routeParams.code2;
    }

    $scope.resetChangePassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            Auth.resetChangePassword($scope.user.newPassword, $scope.resetCode1, $scope.resetCode2, function(success) {
                $scope.message = '';
                notifications.showSuccess({
                    message: 'Password successfully changed.'
                });
                $scope.submitted = false;
                $scope.user.newPassword = "";
                form.$setPristine();
                $timeout(function() {
                    $location.path('/');
                }, 2000);
            }, function(fail) {
                $scope.message = 'Invalid change password link. Check your email again.';
                notifications.showError({
                    message: "Invalid change password link. Check your email again."
                });
            });
        }
    };
});
