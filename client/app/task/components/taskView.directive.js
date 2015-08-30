'use strict'

angular.module('snaptasqApp').directive('taskViewCompact', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        scope: {
            task: '='
        },
        templateUrl: 'app/task/components/taskViewCompact.directive.html',
        // Specify a controller directly in our directive definition.
        //TODO add a commentFactory
        controller: function($scope) {},
        link: function(scope, element, attrs) {
            /*attrs.$observe('task', function(value) {
              if (value) {
                scope.task = value;
              }
            });*/
        }
    };
}).directive('taskViewCompactList', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        templateUrl: 'app/task/components/taskViewCompactList.directive.html',
        // Specify a controller directly in our directive definition.
        //TODO add a commentFactory
        controller: function($scope, Modal, Task) {
            $scope.showApplicants = function(task) {
                Modal.view.applicants(function(data) {})(task);
            }

        }
    };
}).directive('taskViewCompactListEmpty', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        template: '<div class="lead">no tasqs here yet</div>',
    };
});
