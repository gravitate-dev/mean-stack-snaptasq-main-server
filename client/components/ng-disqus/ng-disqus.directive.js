var commentBox = angular.module('ngDisqus', []);

commentBox.directive('ngDisqus', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        //template:"<p>id is {{id}}</p>",
        replace: false,
        //templateUrl: 'components/commentBox/commentBox.directive.template.html',
        scope: {
            id: '=',
        },
        // Specify a controller directly in our directive definition.
        controller: function($scope, $element, $attrs, $timeout, $location, $interval) {
            $scope.loadDisqus = function(source, identifier) {
                var disqus_identifier, disqus_url;
                var url = $location.absUrl() + "#!" + identifier;

                if (window.DISQUS && $("#disqus_thread").length != 0) {
                    jQuery('#disqus_thread').insertAfter(source);
                    //jQuery('#thread_'+$scope.id).insertAfter(source);
                    /** if Disqus exists, call it's reset method with new parameters **/

                    DISQUS.reset({
                        reload: true,
                        config: function() {
                            this.page.identifier = identifier.toString(); //important to convert it to string
                            this.page.url = url;
                        }
                    });
                } else {
                    //insert a wrapper in HTML after the relevant "show comments" link
                    // if (typeof(disqus_loaded)=="undefined" || !disqus_loaded) {
                    //   window.disqus_loaded = 1;
                    $('<div id="disqus_thread"></div>').insertAfter(source);
                    //$('<div id="thread_'+$scope.id+'"></div>').insertAfter(source);
                    disqus_identifier = identifier; //set the identifier argument
                    disqus_url = url; //set the permalink argument
                    //append the Disqus embed script to HTML
                    var dsq = document.createElement('script');
                    dsq.type = 'text/javascript';
                    dsq.async = true;
                    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
                    $('head').append(dsq);

                    // this will poll until embed is loaded, then we will
                    // load the correct disqus id
                    var intervalId = $interval(function() {
                        if (window.DISQUS) {
                            $interval.cancel(intervalId);
                            $scope.loadDisqus(source, identifier);
                            return;
                        } else {}
                    }, 100);
                }
            };
        },
        link: function($scope, $element, $attrs) {
            $scope.$watch('id', function(newVal, oldVal) {
                if (angular.isUndefined(newVal)) {
                    //handle no id
                    return;
                }
                if (newVal != oldVal) {
                    $scope.loadDisqus($element, $scope.id);
                }

            });
            $scope.loadDisqus($element, $scope.id);
        }
    };
});
