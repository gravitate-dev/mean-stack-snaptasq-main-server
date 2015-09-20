angular.module('snaptasqApp').directive('communityinvitablefriendslist', function($parse, $location, Community, Notification) {
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
            console.log($scope.id);
            Community.getInviteableFriends($scope.id, function(users) {
                _.each(users, function(item) {
                    item.shared = false;
                });
                $scope.items = users;
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

            $scope.onClick = function(item) {
                console.log("TODO invite them");
                item.shared = true;
                Notification.success("You have invited " + item.name + " to the community");
            }
        },
        link: function($scope, $element, $attributes) {
            $scope.options = $scope.$eval($attributes.options);
        }
    }
});
