angular.module('snaptasqApp').directive('communitytaskslist', function($parse, $location, Community, SnapListResultManager, Modal) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            id: "=communitytaskslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/community/communitytaskslist/communitytaskslist.template.html',
        controller: function($scope) {
            $scope.items = [];
            var manager = SnapListResultManager.getInstance();
            // searchfilterTEXT must be undefined when initialized
            $scope.searchFilter.text = undefined;
            $scope.$watch('searchFilter.text', _.debounce(function(newvalue) {
                if (angular.isUndefined(newvalue)) return;
                $scope.$apply(function() {
                    manager.reachedEnd = false;
                    manager.newSearch = true;
                });
            }, 500));
            $scope.getOpts = function() {
                var opts = {};
                if (!angular.isUndefined($scope.searchFilter)) {
                    var searchQuery = $scope.searchFilter.text;
                    if (!angular.isUndefined(searchQuery) && !_.isEmpty(searchQuery)) {
                        opts.name = searchQuery;
                    }
                }
                if ($scope.items.length > 0) {
                    opts.age = $scope.items[$scope.items.length - 1].created;
                }
                return opts;
            }
            $scope._goToPath = function(url, $event) {
                if (!angular.isUndefined($event)) {
                    $event.stopPropagation();
                }
                $location.path(url);
            }
            $scope.loadMore = function() {
                if (manager.canLoadMore()) {
                    manager.isLoadingMore = true;
                    var opts = $scope.getOpts();
                    Community.getTasksForGroupId($scope.id, function(data) {
                        $scope.items = manager.handleResults(data);
                    }, opts);
                }
            };
            $scope.loadMore();
            $scope.group = {};
            Community.getById($scope.id, function(item) {
                $scope.group = item;
            });
            $scope.shareMyTasqHere = function() {
                Modal.view.pickMyTaskForCommunity(function(data) {
                    console.log(data);
                })($scope.group);
            }

        },
        link: function($scope, $element, $attributes) {
            $scope.options = $scope.$eval($attributes.options);
        }
    }
});
