'use strict';

angular.module('snaptasqApp')
    .controller('NavbarCtrl', function($scope, $location, Auth, Notify, TaskMarshaler, $interval, $timeout) {
        $scope.responsibleCount = 0;
        $scope.menuAdmin = [];
        $scope.menu = [];

        $scope.reloadMenu = function() {
            Auth.isLoggedInAsync(function(isLoggedIn) {
                if (isLoggedIn) {
                    $scope.menu = [];
                    if (Auth.isBetaUnlocked()) {
                        $scope.menu.push({
                            'title': 'Tasqs',
                            'link': '/tasqs',
                            reqLogin: true
                        });
                        $scope.menu.push({
                            'title': 'Communities',
                            'link': '/communities',
                            reqLogin: true
                        });
                    } else {
                        $scope.menu.push({
                            'title': 'Request Beta',
                            'link': '/requestBeta',
                            reqLogin: true
                        });
                        $scope.menu.push({
                            'title': 'Enter Beta Code',
                            'link': '/beta',
                            reqLogin: true
                        });
                    }
                    if (Auth.isAdmin()) {
                        $scope.menuAdmin = [];
                        $scope.menuAdmin.push({
                            'title': 'Beta',
                            'link': '/admin/beta',
                            reqLogin: true
                        });
                        $scope.menuAdmin.push({
                            'title': 'Community',
                            'link': '/admin/community',
                            reqLogin: true
                        });
                        $scope.menuAdmin.push({
                            'title': 'Users',
                            'link': '/admin/users',
                            reqLogin: true
                        });
                    }
                    $scope.menu.push({
                        'title': 'Rewards',
                        'link': '/rewards',
                        reqLogin: true,
                        reqBeta: false
                    });
                } else {
                    $scope.menu = [{
                        'title': 'Request Beta',
                        'link': '/requestBeta',
                        reqBeta: true
                    }];
                }
            });
        };

        $scope.reloadMenu();
        $scope.goToSignup = function() {
            $location.path("/signin?action=register");
        };
        $scope.goToNotifications = function() {
            $location.path("/notifications");
        };

        /* Notifications from the server from this week */
        $scope.notifications = [];
        /*
        $interval(function() {
            Notify.get(function(notifications) {
                $scope.notifications = notifications;
            });
        }, 5000);
        */
        Notify.get(function(notifications) {
            console.log(notifications);
            $scope.notifications = notifications;
        });

        $scope.isNotCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
        $scope.isAdmin = Auth.isAdmin;
        $scope.currentUser = Auth.getCurrentUser();

        // happens when user logs in with email
        $scope.$on('user.state_change', function(event) {
            $scope.reloadMenu();
        });
        $scope.$watch(function() {
            return Auth.isBetaUnlocked()
        }, function(newVal, oldVal) {
            $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
            //$scope.reloadMenu();
        });

        $scope.$watch(function() {
            return Auth.getCurrentUser()
        }, function(newVal, oldVal) {
            if (typeof newVal !== 'undefined') {
                $scope.currentUser = newVal;
                $scope.reloadMenu();
            }
        });

        $scope.logout = function() {
            Auth.logout();
            TaskMarshaler.removeTask();
            $scope.reloadMenu();
            $location.path('/signin');
        };

        $scope.isActive = function(route) {
            return route === $location.path();
        };

        $scope.$on('count.responsible', function(event, count) {
            $scope.responsibleCount = count;
        });
    });
