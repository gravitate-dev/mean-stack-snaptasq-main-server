angular.module('snaptasqApp').directive('communityuserslist', function($parse, $location, Community) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=communityuserslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/communityuserslist/communityuserslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Community.getById($scope.id, function(group) {
                $scope.items = group.users;
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
