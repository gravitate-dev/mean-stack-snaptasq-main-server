'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/tasks', {
                templateUrl: 'app/task/tasks.html',
                controller: 'TasksCtrl',
                authenticate: true,
                unlockedBetaRequired: true,
            })
            .when('/tasks/:type', {
                templateUrl: 'app/task/tasks.html',
                controller: 'TasksCtrl',
                authenticate: true,
                unlockedBetaRequired: true
            })
            // CREATE TASK
            .when('/task/:action', {
                templateUrl: 'app/task/task.edit.html',
                controller: 'TaskEditCtrl',
                authenticate: false,
                scrollToTopOnLoad: true,
            })
            // VIEW TASK
            .when('/task/view/:id', {
                templateUrl: 'app/task/task.view.html',
                controller: 'TasksCtrl',
                authenticate: false
            })
            // UPDATE TASK
            .when('/task/:action/:id', {
                templateUrl: 'app/task/task.edit.html',
                controller: 'TasksCtrl',
                authenticate: true,
                unlockedBetaRequired: true
            });
    });
