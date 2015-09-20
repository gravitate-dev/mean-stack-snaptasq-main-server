'use strict';

angular.module('snaptasqApp')
    .controller('NavbarCtrl', function($scope, socket, $location, $window, Auth, Notify, User, TaskMarshaler, $interval, $timeout) {
        $scope.responsibleCount = 0;
        $scope.menuAdmin = [];
        $scope.menu = [];
        $scope.accountName = "";
        $scope.myId = "";


        //This has to be listening forever.
        //Otherwise switching accounts will make the navbar WIERD.
        //it will still have the old _me data if i dont have this here
        $scope.$watch(function() {
            return Auth.getCurrentUser()
        }, function(newVal, oldVal) {
            if (typeof newVal !== 'undefined') {
                if (newVal.$promise) {
                    newVal.$promise.then(function(me) {
                        $scope._me = me;
                        $scope.myId = me._id;
                        if (!angular.isUndefined($scope._me.name)) {
                            var temp = $scope._me.name.split(' ')[0];
                            if (temp.length > 9) {
                                $scope.accountName = "Account"
                            } else {
                                $scope.accountName = temp;
                            }
                        }
                        $scope.reloadMenu();
                    });
                }
            }
        });

        $scope.reloadMenu = function() {
            Auth.isLoggedInAsync(function(isLoggedIn) {
                $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
                if (isLoggedIn) {
                    $scope.menu = [];
                    if (Auth.isBetaUnlocked()) {
                        $scope.menu.push({
                            'title': '<i class="fa fa-pencil"></i>&nbsp;Tasqs',
                            'link': '/tasqs',
                            reqLogin: true
                        });
                        $scope.menu.push({
                            'title': '<i class="fa fa-home"></i>&nbsp;Communities',
                            'link': '/communities',
                            reqLogin: true
                        });
                        $scope.menu.push({
                            'title': '<i class="fa fa-globe"></i>&nbsp;Activity',
                            'link': '/community/friends',
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
                        $scope.menu.push({
                            'title': 'Rewards',
                            'link': '/rewards',
                            reqLogin: true,
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
        $scope.isNotCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
        /*undefined;
                Auth.isBetaUnlockedAsync(function(isUnlocked){
                    $scope.isUserBetaLocked = isUnlocked;
                });
        */
        $scope.isAdmin = Auth.isAdmin;
        $scope._me = Auth.getCurrentUser();

        // happens when user logs in with email
        $scope.$on('user.state_change', function(event) {
            $scope.reloadMenu();
        });

        $scope.logout = function() {
            Auth.logout();
            TaskMarshaler.removeTask();
            $scope.reloadMenu();
            $window.location.reload();
        };

        $scope.isActive = function(route) {
            return route === $location.path();
        };

        $scope.$on('count.responsible', function(event, count) {
            $scope.responsibleCount = count;
        });
    }).controller('NavBarNotificationsCtrl', function($scope, socket, $location, $window, Auth, Notify, User, TaskMarshaler, $interval, $timeout) {
        $scope.notifications = [];
        $scope.readNotificationsCount = undefined;
        Notify.get(function(notifications) {
            $scope.notifications = notifications;
            $scope.readNotificationsCount = notifications.length;
            socket.syncUpdates('notify', $scope.notifications);
        });

        $scope.$on("$destroy", function() {
            socket.unsyncUpdates('notify');
        });
        $scope.onOpenNotificaions = function() {
            $scope.readNotificationsCount = $scope.notifications.length;
        }
        $scope._goToPath = function(url, $event) {
            if (!angular.isUndefined($event)) {
                $event.stopPropagation();
            }
            $location.path(url);
        }

    });
