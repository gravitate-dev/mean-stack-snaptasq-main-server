angular.module('snaptasqApp').directive('mysharetocommunitytaskslist', function($parse, Task, Community, Notification, $location, SnapListResultManager) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            // the isShared function is passed in as an attribute and it takes in a task object
            // and it will return if it matches the criteria
            community: "=mysharetocommunitytaskslist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/me/mysharetocommunitytaskslist/mysharetocommunitytaskslist.template.html',
        controller: function($scope) {
            if (angular.isUndefined($scope.community)) {
                throw "Can not have community null for this directive! mysharetocommunitytaskslist";
            }
            $scope.items = [];
            $scope.searchFilter = {
                text: undefined
            };
            var manager = SnapListResultManager.getInstance();
            // searchfilterTEXT must be undefined when initialized
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
                    Task.getMyTasks(function(data) {
                        $scope.items = _.filter(manager.handleResults(data), function(item) {
                            return item.status != 'completed';
                        });
                        _.each($scope.items, function(item) {
                            item.shared = $scope.isShared(item);
                        });
                    }, opts);
                }
            };

            $scope.isShared = function(item) {
                if (angular.isUndefined($scope.community)) {
                    return true;
                }
                var commid = $scope.community._id;
                for (var i = 0; i < item.communitiesIn.length; i++) {
                    if (item.communitiesIn[i].id == commid)
                        return true;
                }
                return false;
            }
            $scope.loadMore();


            $scope.shareTasq = function(task) {
                Community.addTask($scope.community._id, task._id, function(response) {
                    task.shared = true;
                    Notification.success(response);
                }, function(fail) {
                    Notification.warning(fail);
                });
            }
        },
        link: function($scope, $element, $attributes) {
            $scope.options = $scope.$eval($attributes.options);
        }
    }
});
