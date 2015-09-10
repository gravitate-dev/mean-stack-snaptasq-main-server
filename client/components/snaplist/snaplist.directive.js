angular.module('snaptasqApp').directive('snaplistResults', function() {
    return {
        restrict: 'ACE',
        replace: false,
        scope: {},
        templateUrl: 'components/snaplist/base/results/results.directive.html',
        controller: function($scope) {},
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
}).directive('snaplistTitle', function() {
    return {
        restrict: 'ACE',
        replace: false,
        scope: {
            title: "=snaplistTitle"
        },
        templateUrl: 'components/snaplist/base/title/title.directive.html',
        controller: function($scope) {},
        link: function(scope, element, attrs) {}
    };
}).directive('snaplistButton', function() {
    return {
        restrict: 'ACE',
        replace: false,
        scope: {
            button: "=snaplistButton"
        },
        templateUrl: 'components/snaplist/base/button/button.directive.html',
        controller: function($scope) {},
        link: function(scope, element, attrs) {}
    };
});
