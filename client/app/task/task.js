'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/tasqs', {
                templateUrl: 'app/task/tasks.html',
                controller: 'TasksCtrl',
                authenticate: true,
                unlockedBetaRequired: true,
            })
            // CREATE TASK
            .when('/tasq/:action', {
                templateUrl: 'app/task/task.edit.html',
                controller: 'TaskEditCtrl',
                authenticate: false,
                scrollToTopOnLoad: true,
            })
            // VIEW TASK
            .when('/tasq/view/:id', {
                templateUrl: 'app/task/task.view.html',
                controller: 'TaskCtrl',
                authenticate: false
            })
            // UPDATE TASK
            .when('/tasq/:action/:id', {
                templateUrl: 'app/task/task.edit.html',
                controller: 'TaskEditCtrl',
                authenticate: true,
                unlockedBetaRequired: true
            });
    });
