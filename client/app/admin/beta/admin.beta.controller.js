'use strict';

angular.module('snaptasqApp')
    .controller('AdminBetaCtrl', function($scope, $http, Auth, User, Beta, Notification) {
        $scope.betaCodes = [];
        $scope.betaCode = undefined
        $scope.codeUses = 0;
        $scope.codePrefix = "SNAP"
        $scope.$watch('codePrefix', function(newval) {
            $scope.generatePreviewCode();
        });

        $scope.refreshBetas = function() {
            Beta.get(function(data) {
                $scope.betaCodes = data;
            });
        }
        $scope.refreshBetas();

        $scope.activate = function(beta) {
            Beta.activate({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is now active");
                $scope.refreshBetas();
            });
        };

        $scope.deactivate = function(beta) {
            Beta.deactivate({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is now inactive");
                $scope.refreshBetas();
            });
        };

        $scope.delete = function(beta) {
            Beta.delete({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is deleted");
                $scope.refreshBetas();
            })
        }

        $scope.generatePreviewCode = function() {
            var code = $scope.codePrefix;
            var missingCharacters = 16 - code.length;
            if (missingCharacters > 0)
                code += randomString(missingCharacters, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            $scope.previewCode = code;
        }
        $scope.generateBetaCode = function(form) {
            $scope.generatePreviewCode();
            var maxUses = form.codeUses.$viewValue;
            var prefix = form.codePrefix.$viewValue;
            if (angular.isUndefined(maxUses) || maxUses > 100 || maxUses == 0) {
                alert("Beta code maxUses must be between 1-100");
                return;
            }

            if (!angular.isUndefined(prefix) && prefix.length > 10) {
                alert("Beta code prefix too long. Only 10 digits max");
                return;
            }

            Beta.generateCode({}, {
                maxUses: maxUses,
                name: $scope.previewCode
            }, function(data) {
                Notification.success({
                    message: "Beta code generated!",
                    delay: 5000
                });
                $scope.submitted = false;
                $scope.betaCode = data;
                form.$setPristine();

                Beta.get(function(data) {
                    $scope.betaCodes = data;
                });
            }, function(err) {
                if (err && err.data && err.data.message)
                    Notification.error({
                        message: "Failed to create beta code " + err.data.message,
                        delay: 5000
                    });
                else {
                    Notification.error({
                        message: "Failed to create beta code",
                        delay: 5000
                    });
                }
            });
        };
    });
