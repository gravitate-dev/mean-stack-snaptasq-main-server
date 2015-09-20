angular.module('snaptasqApp').directive('communityuserslist', function($parse, $location, Community, Modal) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=communityuserslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/community/communityuserslist/communityuserslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            $scope.group = {};
            Community.getById($scope.id, function(group) {
                $scope.group = group;
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
            };

            $scope.inviteFriends = function() {
                Modal.view.inviteFriendToCommunity(function(data) {
                    console.log(data);
                })($scope.group);
            };
        },
        link: function($scope, $element, $attributes) {
            $scope.options = $scope.$eval($attributes.options);
        }
    }
});
