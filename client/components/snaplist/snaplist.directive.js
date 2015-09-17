angular.module('snaptasqApp')
    .factory('SnapListResultManager', function() {
        var Manager = function() {
            this.items = [];
            this.reachedEnd = false;
            this.newSearch = false;
            this.isLoadingMore = false;
        };

        Manager.prototype.init = function() {
            this.reachedEnd = false;
        }
        Manager.prototype.handleResults = function(data) {
            var that = this;
            this.isLoadingMore = false;
            this.reachedEnd = (data.length == 0);
            if (this.newSearch) {
                this.items = data;
                this.newSearch = false;
            } else {
                _.each(data, function(d) {
                    that.items.push(d);
                });
            }
            return this.items;
        }

        Manager.prototype.canLoadMore = function() {
            var cant = (this.reachedEnd == true || this.isLoadingMore);
            return !cant;
        };
        return {
            getInstance: function() {
                return new Manager();
            }
        }

    })
    .directive('snaplistResults', function() {
        return {
            restrict: 'ACE',
            replace: false,
            scope: {},
            templateUrl: 'components/snaplist/base/results/results.directive.html',
            controller: function($scope) {},
            link: function(scope, element, attrs) {}
        };
    }).directive('snaplistResultsTask', function($location) {
        return {
            restrict: 'ACE',
            replace: false,
            scope: {
                item: "=snaplistResultsTask"
            },
            templateUrl: 'components/snaplist/base/results/task.results.template.html',
            controller: function($scope) {
                $scope._goToPath = function(url, $event) {
                    if (!angular.isUndefined($event)) {
                        $event.stopPropagation();
                    }
                    $location.path(url);
                }
            },
            link: function(scope, element, attrs) {}
        };
    }).directive('snaplistSearch', function() {
        return {
            restrict: 'ACE',
            replace: false,
            scope: {
                searchFilter: "=snaplistSearch"
            },
            templateUrl: 'components/snaplist/base/search/search.directive.html',
            controller: function($scope) {},
            link: function(scope, element, attrs) {}
        };
    }).directive('snaplistTitle', function($location) {
        return {
            restrict: 'ACE',
            replace: false,
            scope: {
                title: "=snaplistTitle",
                notification: "=notification",
            },
            templateUrl: 'components/snaplist/base/title/title.directive.html',
            controller: function($scope) {
                if (!angular.isUndefined($scope.notification)) {
                    $scope.notificationCount = $scope.notification.count;
                    $scope.notificationHref = $scope.notification.href;
                }
                $scope._goToPath = function(url, $event) {
                    if (!angular.isUndefined($event)) {
                        $event.stopPropagation();
                    }
                    $location.path(url);
                }
            },
            link: function(scope, element, attrs) {}
        };
    }).directive('snaplistButton', function() {
        return {
            restrict: 'AE',
            replace: false,
            scope: {
                button: "=snaplistButton"
            },
            templateUrl: 'components/snaplist/base/button/button.directive.html',
            controller: function($scope) {},
            link: function(scope, element, attrs) {}
        };
    });
