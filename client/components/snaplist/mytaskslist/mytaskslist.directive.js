angular.module('snaptasqApp').directive('mytaskslist', function($parse, Task, $location) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/mytaskslist/mytaskslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            //$scope.images = [1, 2, 3, 4, 5, 6, 7, 8];
            Task.getMyTasks(function(data) {
                $scope.items = data;
            });
            $scope.loadMore = function() {
                /*  console.log("LOAD MOAR");
                  var last = $scope.images[$scope.images.length - 1];
                  for(var i = 1; i <= 8; i++) {
                    $scope.images.push(last + i);
                }*/
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
