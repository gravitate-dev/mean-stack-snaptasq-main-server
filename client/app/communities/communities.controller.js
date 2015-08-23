'use strict';
angular.module('snaptasqApp').controller('CommunitiesCtrl', function($scope, Community, $http, $window) {
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
    $scope.requestBetaErrors = [];

    $scope.showSuggestCommunityModal = function() {

    };


    $scope.listCommunities = function() {
        Community.get({
            entryMethod: "open"
        }, function(data) {
            $scope.publicCommunities = data;
        });
        Community.get({
            entryMethod: "open"
        }, function(data) {
            $scope.publicCommunities = data;
        });
        $scope.publicCommunities = data;
    }
    $scope.listCommunities();
    $scope.communities = [{
        name: "Santa Clara University"
    }, {
        name: "Santa Clara"
    }, {
        name: "Walsh"
    }, ];
    /*
    , {
            name: "Santa Clara"
        }, {
            name: "San Jose"
        }, {
            name: "Bay Area"
        }, {
            name: "pets"
        },
        */
});
