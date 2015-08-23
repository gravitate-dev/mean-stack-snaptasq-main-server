'use strict';

angular.module('snaptasqApp')
    .controller('SigninCtrl', function($scope, Beta, $routeParams, $timeout, Task, TaskMarshaler, Auth, $location, $window, notifications, vcRecaptchaService, $rootScope) {
        $scope.handleParams = function() {
            if ($routeParams.action) {
                if ($routeParams.action == "register") {
                    $scope.setViewRegistration();
                } else {
                    $scope.tabSignup = true;
                    $scope.tabCreateAccount = false;
                }
            }
        }

        $scope.setViewRegistration = function() {
            $scope.tabSignup = false;
            $scope.tabCreateAccount = false;
            $scope.tabCreateAccount = true;
        }
        $scope.$on('$routeUpdate', function() {
            $scope.handleParams();
        });
        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.user = {};
        $scope.errors = {};
        $scope.registerErrors = [];

        $scope.handleParams();
        $scope.resetCaptcha = function() {
            vcRecaptchaService.reload();
        };

        function onRegisterFail(form, fail) {
            $scope.resetCaptcha();
            if (fail.data.status && fail.data.status == "warn")
                notifications.showWarning({
                    message: fail.data.message
                });
            else
                notifications.showError({
                    message: fail.data.message
                });
        }

        function onRegisterSuccess(user, emailAddress) {
            notifications.showSuccess({
                message: 'Verification Email Sent. Please check your inbox, ' + emailAddress
            });
            handleTaskPostAuthenticate(user);
        };
        $scope.register = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                Auth.createUser(form.captchaResponse.$viewValue, {
                        name: form.name.$viewValue,
                        email: form.email.$viewValue,
                        password: form.password.$viewValue
                    }, function(user) {
                        onRegisterSuccess(user, form.email.$viewValue)
                    }, function(fail) {
                        onRegisterFail(form, fail);
                    })
                    .catch(function(err) {
                        var err = err.data;
                        $scope.registerErrors = [];
                        angular.forEach(err.errors, function(error, field) {
                            console.log(error.message);
                            //form[field].$setValidity('mongoose', false);
                            $scope.registerErrors.push(field + ": " + error.message);
                        });
                    });
            }
        };

        $scope.loginOauth = function(provider) {
            $window.location.href = '/auth/' + provider;
        };

        var handleTaskPostAuthenticate = function(user) {
            // in order to refresh the badges we do this here
            $rootScope.$broadcast('user.state_change', {});
            if (user.requiresBeta && $scope._beta) {
                $location.path('/beta');
            } else {
                if (TaskMarshaler.hasTask()) {
                    $location.path("/task/create");
                } else {
                    $location.path('/');
                }
            }
        }
        $scope.login = function(form) {

            $scope.submitted = true;
            if (form.$valid) {
                Auth.login({
                        email: $scope.user.email,
                        password: $scope.user.password
                    })
                    .then(function(response) {
                        handleTaskPostAuthenticate(response.user);
                    })
                    .catch(function(err) {
                        $scope.errors.other = err.message;
                    });
            }
        };
    });
