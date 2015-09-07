app.controller('GlobalCtrl', function($scope, BadgeAlerts, localStorageService, $q, $templateCache, $interval, notifications, $http, $anchorScroll, Auth, User, $location, $rootScope) {
    $rootScope.title = "snaptasq";
    $scope.scrollTop = function() {
        $('html, body').animate({
            scrollTop: 0
        }, 'slow');
    }
    $scope._goToPath = function(url) {
        $location.path(url);
    }
    $scope.$on('$routeChangeStart', function(next, current) {
        /*
         * To reset the styles each time the page changes
         */
        $scope._showFooter = true;
        $scope._bgcolor = "white";
    });

    $scope.snapYellowCSS = "#fcd11a";
    $scope._bgcolorSnapYellow = function() {
        $scope._bgcolor = "#fcd11a";
    }
    $scope._bgcolorWhite = function() {
        $scope._bgcolor = "white";
    }
    $scope._bgcolorGrey = function() {
        $scope._bgcolor = "#f6f6f6";
    }
    $scope._noFooter = function() {
        $scope._showFooter = false;
    }

    $scope._needsBetaCode = function() {}

    $scope.viewport = '';
    // hook for viewport
    (function($, viewport) {
        // Execute code each time window size changes
        $(window).resize(
            viewport.changed(function() {
                $scope.viewport = viewport.current();
            }));
        $(document).ready(function() {
            $scope.viewport = viewport.current();
        });

    })(jQuery, ResponsiveBootstrapToolkit);
    $scope.isViewCompact = function() {
            if ($scope.viewport == "xs" || $scope.viewport == "sm")
                return true;
            if ($scope._isMobile)
                return true;
            return false;
        }
        //When true people who go to sign up, will be required to enter a beta code
        //before they are allowed to login.
        //In the case of continue with faceboook its tricky
    $scope._beta = true;
    window._beta = true;
    $scope._badgeAlerts = BadgeAlerts;
    $scope._showFooter = true;
    $scope._bgcolor = "white";
    $scope._isLive = $location.absUrl().indexOf("snaptasq.com") != -1;
    $scope._hostName = $scope._isLive ? "http://snaptasq.com" : "http://localhost:8000";

    //$rootScope._me = undefined;
    $scope._isMobile = $.browser.mobile;

    $rootScope._refreshMe = function(cb) {
        //console.log("not needed");

    }

    $scope.$on('refreshME', function(event) {
        //$rootScope._refreshMe();
    });
    $scope._share = function(provider, title, desc) {
        var url = $location.absUrl();
        var snaptasqLogoUrl = "http://snaptasq.com/assets/logos/snaptasq.png";
        title = title || "snaptasq";
        desc = desc || "Help your friend out. snaptasq";
        var windowOpenOptions = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600';
        if (provider == 'fb') {
            FB.ui({
                    method: 'feed',
                    name: title,
                    link: url,
                    //picture: 'http://fbrell.com/f8.jpg',
                    caption: 'via snaptasq',
                    description: desc
                },
                function(response) {
                    if (response && response.post_id) {
                        //alert('Post was published.');
                    } else {
                        //alert('Post was not published.');
                    }
                }
            );
        } else if (provider == "google") {
            window.open("https://plus.google.com/share?url=" + url, '', windowOpenOptions);
        } else if (provider == "pintrest") {
            window.open("http://pinterest.com/pin/create/button/?url=" + url + "&media=" + snaptasqLogoUrl + "&description=" + desc, '', windowOpenOptions);
        }
    }
});
