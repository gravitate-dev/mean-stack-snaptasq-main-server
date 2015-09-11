angular.module('snaptasqApp').directive('communitytaskslist', function($parse, $location, Community) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=communitytaskslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/communitytaskslist/communitytaskslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Community.getTasksForGroupId($scope.id, function(tasks) {
                $scope.items = tasks;
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
