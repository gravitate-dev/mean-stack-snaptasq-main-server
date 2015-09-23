'use strict';
angular.module('snaptasqApp')
    .controller('BetaHelpCtrl', function($scope, _me) {
        $scope._me = undefined;
        _me.$promise.then(function(me) {
            $scope._me = me;
        })
    });
