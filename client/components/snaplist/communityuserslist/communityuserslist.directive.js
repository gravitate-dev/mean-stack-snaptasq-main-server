angular.module('snaptasqApp').directive('communityuserslist', function($parse, $location) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            items: "=communityuserslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/communityuserslist/communityuserslist.template.html',
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
