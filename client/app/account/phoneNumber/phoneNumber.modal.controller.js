'use strict'
app.controller('PhoneNumberModalCtrl', function($scope, $rootScope, $timeout, User, Notification, Modal) {
    $scope.error = undefined;
    $scope.phoneNumber = "";
    $scope.isValid = true;
    $scope.canEnterVerificationCode = false;

    $scope.goBack = function() {
        $scope.canEnterVerificationCode = false;
    }
    $scope.$watch('phoneNumber', function(newVal) {
        console.log(newVal);
        $scope.error = undefined;
        $scope.isValid = isvalidNumber(newVal);
    });

    $scope.redeemCode = function(code) {
        User.redeemVerificationText(code, function(success) {
            $rootScope.$broadcast('phoneVerified');
            Notification.success(success);
            Modal.closeCurrent();
        }, function(fail) {
            Notification.error(fail);
        });
    }
    $scope.sendCode = function(number) {
        if (isvalidNumber(number)) {
            User.sendVerificationText(number, function(success) {
                $scope.canEnterVerificationCode = true;
                Notification.success(success);
            }, function(fail) {
                $scope.canEnterVerificationCode = false;
                Notification.error(fail);
            });
        } else {
            $scope.error = "Please enter a valid phone number";
        }
    }

    function isvalidNumber(inputtxt) {
        if (inputtxt == undefined) {
            return false;
        }
        var phoneno = /^[0-9]{10}$/;
        if (inputtxt.match(phoneno)) {
            return true;
        } else {
            return false;
        }
    }
});
