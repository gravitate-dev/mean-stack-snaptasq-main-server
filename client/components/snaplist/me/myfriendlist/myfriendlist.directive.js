angular.module('snaptasqApp').directive('myfriendlist', function($parse, $location, User) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/me/myfriendlist/myfriendlist.template.html',
        controller: function($scope) {
            $scope.items = [];

            $scope.limitCount = 25;
            $scope.showMore = function() {
                $scope.limitCount += 25;
            }
            User.get(function(data) {
                $scope.items = data.friends;
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
