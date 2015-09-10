angular.module('snaptasqApp').directive('mytaskslist', function($parse, $location) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            items: "=mytaskslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/mytaskslist/mytaskslist.template.html',
        controller: function($scope) {
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
