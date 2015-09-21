'use strict';
angular.module('snaptasqApp')
    .controller('DebugCtrl', function($scope, $rootScope) {
        $scope.metaColor = "#FF0000";
        $scope.$watch('metaColor', function(newVal) {
            $rootScope.$broadcast('changedMeta', newVal);
        });

    });
