angular.module('snaptasqApp').directive('friendcommunitylist', function($parse, $location) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            items: "=friendcommunitylist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/friendcommunitylist/friendcommunitylist.template.html',
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
