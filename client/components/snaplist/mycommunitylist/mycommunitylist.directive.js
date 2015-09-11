angular.module('snaptasqApp').directive('mycommunitylist', function($parse, $location, Community, User) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/mycommunitylist/mycommunitylist.template.html',
        controller: function($scope) {
            $scope.items = [];
            User.get(function(d) {
                Community.getUserCommunties(d._id, function(data) {
                    $scope.items = data;
                });
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
