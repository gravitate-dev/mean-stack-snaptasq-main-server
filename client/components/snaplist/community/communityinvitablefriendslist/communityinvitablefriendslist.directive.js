angular.module('snaptasqApp').directive('communityinvitablefriendslist', function($parse, $location, Community) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=communityinvitablefriendslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/community/communityinvitablefriendslist/communityinvitablefriendslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            Community.getInviteableFriends($scope.id, function(group) {
                $scope.items = group.users;
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
