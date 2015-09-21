'use strict';

angular.module('snaptasqApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/betaHelp', {
                templateUrl: 'app/betaHelp/betaHelp.html',
                controller: 'BetaHelpCtrl',
                authenticate: true,
            })
    });
