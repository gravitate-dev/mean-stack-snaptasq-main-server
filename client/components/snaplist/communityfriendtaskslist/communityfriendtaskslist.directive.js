angular.module('snaptasqApp').directive('communityfriendtaskslist', function($parse, $location, Task) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/communityfriendtaskslist/communityfriendtaskslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Task.getMyFriendsTasks(function(tasks) {
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
