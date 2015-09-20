angular.module('snaptasqApp').directive('mycommunitylist', function($parse, $location, Community, User) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            items: "=mycommunitylist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/me/mycommunitylist/mycommunitylist.template.html',
        controller: function($scope) {
            $scope.limitCount = 25;
            $scope.showMore = function() {
                $scope.limitCount += 25;
            }
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
