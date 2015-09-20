angular.module('snaptasqApp').directive('mysharecommunitylist', function($parse, $location, Notification, Community, User) {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            task: "=mysharecommunitylist",
            searchFilter: "=filter",
            listTitle: "=listTitle"
        },
        templateUrl: 'components/snaplist/me/mysharecommunitylist/mysharecommunitylist.template.html',
        controller: function($scope) {
            $scope.items = [];
            $scope.limitCount = 25;
            $scope.showMore = function() {
                $scope.limitCount += 25;
            }

            $scope.init = function() {
                User.get(function(d) {
                    Community.getUserCommunties(d._id, function(data) {
                        //i want to see if i already shared it 
                        _.each(data, function(item) {
                            item.shared = false;
                            _.each($scope.task.communitiesIn, function(comm) {
                                if (comm.id == item.id) {
                                    item.shared = true;
                                }
                            });
                        });
                        $scope.items = data;

                    });
                });
            };

            $scope.init();
            $scope.shareToCommunity = function(comm, taskId) {
                Community.addTask(comm.id, taskId, function(response) {
                    comm.shared = true;
                    Notification.success(response);
                }, function(fail) {
                    Notification.warning(fail);
                });
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
