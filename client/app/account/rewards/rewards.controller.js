'use strict';

angular.module('snaptasqApp')
    .controller('RewardsCtrl', function($scope, $window, $interval, $location, $timeout, User, notifications, Notification) {
        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.errors = {};
        $scope.betaCode = "";

        $scope.rewards = [];
        var amazon = {
            title: "5$ Amazon Digital Gift Card",
            status: "OPEN",
            description: "app/account/rewards/rewardInstructions/reward.amazon.html"
        };
        $scope.rewards.push(amazon);
        var tshirt = {
            title: "SnapTasq T-shirt",
            status: "OPEN",
            description: "app/account/rewards/rewardInstructions/reward.tshirt.html"
        };
        $scope.rewards.push(tshirt);
    });
