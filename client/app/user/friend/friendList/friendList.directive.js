angular.module('snaptasqApp').directive('friendList', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        templateUrl: 'app/user/friend/friendList/friendList.template.html',
        controller: function($scope) {},
        link: function($scope, $element, $attributes) {
            $scope.items = $scope.$eval($attributes.friendList);
        }
    }
});
