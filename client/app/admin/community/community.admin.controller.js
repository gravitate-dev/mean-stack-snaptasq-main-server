'use strict';

angular.module('snaptasqApp')
    .controller('AdminCommunityCtrl', function($scope, $http, Auth, Community, Notification) {

        $scope.name = "";
        $scope.entryMethods = [{
            id: 1,
            name: 'open'
        }, {
            id: 2,
            name: 'email'
        }, {
            id: 2,
            name: 'area code'
        }];
        $scope.communities = [];
        $scope.submitted = false;
        $scope.createCommunity = function(form) {
            $scope.submitted = true;
            if (form.$valid) {

                var data = {
                    name: form.name.$viewValue,
                    entryMethod: form.entryMethod.$viewValue.name,
                    entryParam: form.entryParam.$viewValue
                };

                Community.create(data, function(data) {
                    Notification.success("Created");
                    $scope.listCommunities();
                })
            }
        }

        $scope.listCommunities = function() {
            Community.get({}, function(data) {
                $scope.communities = data;
            })
        }
        $scope.listCommunities();

        $scope.delete = function(community) {
            Community.delete(community._id, function(data) {
                console.log(data);
                $scope.listCommunities();
            });
        }
    });
