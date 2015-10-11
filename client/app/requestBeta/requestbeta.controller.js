'use strict';
angular.module('snaptasqApp').controller('RequestBetaCtrl', function($scope, Beta, $http, $window) {
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
}).directive('betaEmailSignUp', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        template: '<div class="sendgrid-subscription-widget" data-message-success="Thank you. We will contact you in the near future." data-submit-text="Submit" data-token="SAcCNqsWMVXRHCm7rnWYW0JG0Fg2Y%2BWPSWMRqnPS9LiJCHKEjYE4K3YeJRqW%2BkXz"></div>',
        controller: function($scope) {
            ! function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0],
                    p = /^http:/.test(d.location) ? "http" : "https";
                if (1) //have to hack this broken script
                {
                    js = d.createElement(s);
                    js.id = id;
                    js.src = p + "://s3.amazonaws.com/subscription-cdn/0.2/widget.min.js";
                    fjs.parentNode.insertBefore(js, fjs);
                }
            }(document, "script", "sendgrid-subscription-widget-js");
        },
        link: function(scope, element, attrs) {
            /*attrs.$observe('task', function(value) {
              if (value) {
                scope.task = value;
              }
            });*/
        }
    }
});
