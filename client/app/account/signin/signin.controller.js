'use strict';

angular.module('snaptasqApp')
    .controller('SigninCtrl', function($scope, Beta, $routeParams, $timeout, Task, TaskMarshaler, Auth, $location, $window, notifications, vcRecaptchaService, $rootScope) {


        function createCookie(name, value, days) {
            var expires;
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            } else expires = "";
            document.cookie = name + "=" + value + expires + "; path=/";
        }

        function readCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        function eraseCookie(name) {
            createCookie(name, "", -1);
        }

        function areCookiesEnabled() {
            var r = false;
            createCookie("testing", "Hello", 1);
            if (readCookie("testing") != null) {
                r = true;
                eraseCookie("testing");
            }
            return r;
        }
        $scope.areCookiesEnabled = areCookiesEnabled();
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
                            //form[field].$setValidity('mongoose', false);
                            $scope.registerErrors.push(error.message);
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
            $timeout(function() {
                $window.location.reload();
            }, 100)
            if (user.requiresBeta && $scope._beta) {
                $location.path('/beta');
            } else {
                if (TaskMarshaler.hasTask()) {
                    $location.path("/tasq/create");
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
