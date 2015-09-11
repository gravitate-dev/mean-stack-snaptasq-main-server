angular.module('snaptasqApp').directive('friendtaskslist', function($parse, $location, Task) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=friendtaskslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/friendtaskslist/friendtaskslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Task.getFriendTasks($scope.id, function(data) {
                $scope.items = data;
            });
            $scope._goToPath = function(url, $event) {
                if (!angular.isUndefined($event)) {
                    $event.stopPropagation();
                }
                $location.path(url);
            }
        },
        link: function($scope, $element, $attributes) {
            $scope.options = $scope.$eval($attributes.options);
        }
    }
});
