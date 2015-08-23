var commentBox = angular.module('commentBox', []);

commentBox.directive('commentBox', function() {
    return {
        restrict: 'A',
        // Replace the div with our template
        replace: false,
        templateUrl: 'components/commentBox/commentBox.directive.template.html',
        scope: {
            commentBox: '=',
            onClose: '='
        },
        // Specify a controller directly in our directive definition.
        //TODO add a commentFactory
        controller: function($scope) {
            $scope.close = function() {
                $scope.onClose($scope.commentBox);
                //also need to broadcast a change to the parent

            }
            $scope.comments = [];
            /*if ($scope.githubUser) {
              return githubFactory.userRepos($scope.githubUser).success(function(rsp) {
                return $scope.repos = rsp.data;
              });
            } else {
              return githubFactory.repos().success(function(rsp) {
                return $scope.repos = rsp.data;
              });
            }*/
        }
    };
});
