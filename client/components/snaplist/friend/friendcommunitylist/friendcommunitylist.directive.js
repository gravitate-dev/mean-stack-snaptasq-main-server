angular.module('snaptasqApp').directive('friendcommunitylist', function($parse, $location, Community) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=friendcommunitylist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/friend/friendcommunitylist/friendcommunitylist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Community.getUserCommunties($scope.id, function(data) {
                $scope.items = data;
            });
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
