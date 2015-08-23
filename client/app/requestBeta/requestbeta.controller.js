'use strict';
angular.module('snaptasqApp').controller('RequestBetaCtrl', function($scope, Beta, $http, $window) {
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
    $scope.requestBetaErrors = [];

    $scope.requestBeta = function(form) {
        $scope.submitted = true;

        if (!angular.isUndefined(form.captchaResponse) && !angular.isUndefined(form.email)) {
            console.log("addEmailBetaList");
            Beta.addEmailBetaList({
                captcha: form.captchaResponse
            }, {
                email: form.email
            }, function(data) {
                console.log("SUCCESS");
                //onRegisterSuccess(user,form.email.$viewValue)
            }, function(fail) {
                console.log("FAIL");
                //onRegisterFail(form,fail);
                /*
                var err = err.data;
                $scope.requestBetaErrors = [];
                angular.forEach(err.errors, function(error, field) {
                  console.log(error.message);
                    //form[field].$setValidity('mongoose', false);
                    $scope.requestBetaErrors.push(field+": "+error.message);
                  });
                */
            })
        }
    }
}).directive('betaEmailSignUp', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        template: '<div class="sendgrid-subscription-widget" data-message-success="Thank you. You will be emailed a beta code when we start our beta trials." data-submit-text="Request Beta Code" data-token="SAcCNqsWMVXRHCm7rnWYW0JG0Fg2Y%2BWPSWMRqnPS9LiJCHKEjYE4K3YeJRqW%2BkXz"></div>',
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
