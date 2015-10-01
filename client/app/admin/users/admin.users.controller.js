'use strict';

angular.module('snaptasqApp')
    .controller('AdminUsersCtrl', function($scope, $http, Auth, User) {
        $scope.users = [];
        $scope.userFilter = {
                requiresBeta: false,
                phone: {
                    verified: false
                }
            }
            // Use the User $resource to fetch all users
        User.getAllUsers(function(users) {
            $scope.users = users;
        });

        $scope.delete = function(user) {
            User.remove({
                id: user._id
            });
            angular.forEach($scope.users, function(u, i) {
                if (u === user) {
                    $scope.users.splice(i, 1);
                }
            });
        };
    });
