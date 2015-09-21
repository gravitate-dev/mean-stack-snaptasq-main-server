'use strict';
var app = angular.module('snaptasqApp', ['ngAudio', 'infinite-scroll', 'angucomplete-alt' /*,'bcherny/formatAsCurrency'*/ , 'slick', 'angularMoment', 'LocalStorageModule', 'seo', 'FBAngular', 'ezfb', 'djds4rce.angular-socialshare', 'ngDisqus', 'ui-notification', 'pasvaz.bindonce', 'uiGmapgoogle-maps', 'ngAutocomplete', 'commentBox', 'ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', 'btford.socket-io', 'ui.bootstrap', 'ngAnimate', 'ngNotificationsBar', 'vcRecaptcha'])
    .config(function($routeProvider) {
        $routeProvider.otherwise({
            redirectTo: '/'
        });
        var originalWhen = $routeProvider.when;

        $routeProvider.when = function(path, route) {

            route.resolve = {
                _me: ['User', '$q', '$rootScope', 'BadgeAlerts', function(User, $q, $rootScope, BadgeAlerts) {
                    var deferred = $q.defer();
                    return User.get(function(data) {
                        $rootScope._me = data;
                        if (!angular.isUndefined(data) && !angular.isUndefined(data.requiresBeta) && data.requiresBeta) {
                            BadgeAlerts.add(BadgeAlerts.MISSING_BETA_CODE);
                        }
                        deferred.resolve(data);
                    });
                    return deferred.promise;
                }]
            };
            return originalWhen.call($routeProvider, path, route);
        };
        /* THROTTLE MILISECONDS IS FOR THE NG INIFNITE SCROLL, if pages are tripping over themselves raise this!
         * Default is 250
         */
    }).value('THROTTLE_MILLISECONDS', 500)
    .config(function($locationProvider, $httpProvider, $animateProvider, notificationsConfigProvider) {
        //To fix carousel with ngAnimate
        $animateProvider.classNameFilter(/carousel/);
        $locationProvider.html5Mode(true).hashPrefix('!');
        $httpProvider.interceptors.push('authInterceptor');
        notificationsConfigProvider.setAcceptHTML(true);

    }).config(function(NotificationProvider) {
        NotificationProvider.setOptions({
            replaceMessage: true
        });
    }).run(function($FB, ezfb) {
        //$FB.init('764169247036130');
        ezfb.init({
            // This is my FB app id for plunker demo app
            appId: '764169247036130'
        });
        moment.locale('en', {
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "seconds",
                m: "1m",
                mm: "%dm",
                h: "1h",
                hh: "%dh",
                d: "1d",
                dd: "%dd",
                M: "1m",
                MM: "%dm",
                y: "1y",
                yy: "%dy"
            }
        });
    })
    .factory('Page', function() {
        var title = 'snaptasq';
        return {
            title: function() {
                return title;
            },
            setTitle: function(newTitle) {
                title = newTitle
            }
        };
    })
    .factory('authInterceptor', function($rootScope, $q, $cookieStore, $location) {
        return {
            // Add authorization token to headers
            request: function(config) {
                config.headers = config.headers || {};
                if ($cookieStore.get('token')) {
                    config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
                }
                return config;
            },
            // Intercept 401s and redirect you to login
            responseError: function(response) {
                if (response.status === 401) {
                    if ($location.absUrl().indexOf('view') != -1 ||
                        $location.absUrl().indexOf('resetPassword') != -1) {} else {
                        //$location.path('/login');
                        // remove any stale tokens
                        $cookieStore.remove('token');
                    }
                    return $q.reject(response);
                } else {
                    return $q.reject(response);
                }
            }
        };
    })
    .factory('KeyEventService', ['$rootScope', function($rootScope) {
        var service = {
            EVENTS: {
                EVENT_ESCAPE: "esc",
                EVENT_RIGHT: "right",
                EVENT_LEFT: "left",
                EVENT_UP: "up",
                EVENT_DOWN: "down"
            }
        };

        service.doEscape = function() {};
        // this method will register a function to call when escape is clicked
        service.escape = function(fn) {
            service.doEscape = fn;
            return this;
        };
        service.register = function(scope) {
            scope.$on("keyService:keyup", function(event, data) {
                service.doEscape();
            });
            return this;
        }

        service._init = function() {
            function handleEvent(e) {
                if (e.keyCode == 27) {
                    $rootScope.$broadcast("keyService:keyup", service.EVENTS.EVENT_ESCAPE);
                } // escape key maps to keycode `27`
            }
            $(document).keyup(handleEvent);
        }


        // alternatively, create a callback function and $broadcast from there if making an ajax call

        return service;
    }])
    .run(function($rootScope, $location, $timeout, $window, Auth, KeyEventService) {
        // Init is only called ONCE never again
        KeyEventService._init();
        // Redirect to login if route requires auth and you're not logged in
        $rootScope.$on('$routeChangeStart', function(event, next) {
            if (angular.isUndefined(next) || angular.isUndefined(next.$$route)) {
                return;
            }
            if (next.$$route.controller == "MainCtrl") {
                $rootScope.isMainPage = true;
            } else {
                $rootScope.isMainPage = false;
            }
            if (next.authenticate) {
                Auth.isLoggedInAsync(function(loggedIn) {
                    if (!loggedIn) {
                        return $location.path('/login');
                    }
                    if (next.adminRequired && !Auth.isAdmin()) {
                        $location.path('/');
                    }
                    /*if (next.fbFriendsPermission){
                        Auth.hasFacebookPermission('user_friends',function(hasPermission){
                            if (!hasPermission){
                                $location.path('/communities/permission');
                            }
                        });
            }*/
                });
            }
            if (next.adminRequired && !next.authenticate) {
                console.error("THIS Path is broken", next);
            }

            if (next.unlockedBetaRequired && window._beta && !Auth.isBetaUnlocked()) {
                $location.path('/beta');
            }
        });
        $rootScope.$on('$routeChangeSuccess', function(event, next) {
            if (angular.isUndefined(next) || angular.isUndefined(next.$$route)) {
                return;
            }
            if (next.$$route.scrollToTopOnLoad) {
                $('html, body').animate({
                    scrollTop: 0
                }, 'slow');
            }

        })
    });

app.controller('GlobalCtrl', function GlobalCtrl($anchorScroll, $http, $interval, $location, $q, $rootScope, $scope, $templateCache, $timeout, Auth, BadgeAlerts, localStorageService, notifications, socket, User) {
    //socket.connect();
    $scope.metaColor = "#00FF00";
    $scope.$on('changedMeta', function($event, data) {
        console.log(data);
        $scope.metaColor = data;
    });
    socket.socket.on('lol', function(data) {
            console.log(data);
        })
        /*var socket = io.connect({transports: ['websocket']});
        socket.on('news', function (data) {
            console.log(data);
            socket.emit('my other event', { my: 'data' });
        });

        socket.on('connect_error', function(e) {
            socket.io.reconnection(false);
        });
    
        socket.socket.on('lol', function(item) {
            console.log(item);
        });
        */
    $timeout(function() {
        /* CLOSE NAVBAR ON CLICK */
        /* Javascript queueing */
        $('#navbar-main .nav').on('click', function() {
            //check if navbar-toggle is visible
            if ($('.navbar-toggle').css('display') == "none") {
                return;
            } else {
                $('.navbar-toggle').click() //bootstrap 3.x by Richard
            }
        })
    }, 10);
    var tawkCounter = 0;
    var tawkListener = $interval(function() {
        //add class to tawkTo
        tawkCounter++;
        if (tawkCounter > 1000) {
            console.error("Tawk to not found.")
            $interval.cancel(tawkListener);
        }
        var tawk = $("#tawkchat-iframe-container");
        if (tawk.length != 0) {
            $("#tawkchat-iframe-container").addClass('hidden-xs');
            $interval.cancel(tawkListener);
        }
    }, 10)
    $rootScope.title = "snaptasq";
    $scope.scrollTop = function() {
            $('html, body').animate({
                scrollTop: 0
            }, 'slow');
        }
        /* if given $event it will consume the event */
    $scope._goToPath = function(url, $event) {
        if (!angular.isUndefined($event)) {
            $event.stopPropagation();
        }
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

    $scope.isViewCompact = function() {
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

app.filter("typeAheadNoResultsOnEmpty", function() {
        return function(input, searchInput) {
            if (_.isEmpty(input)) input = [{
                name: searchInput,
                noresults: true
            }];
            return input;
        };
    }).filter('chunk', function() {
        return _.memoize(chunk);
    }).directive('includeReplace', function() {
        return {
            require: 'ngInclude',
            restrict: 'A',
            /* optional */
            link: function(scope, el, attrs) {
                el.replaceWith(el.children());
            }
        };
    }).filter('capitalize', function() {
        return function(input, scope) {
            if (input != null)
                input = input.toLowerCase();
            return input.substring(0, 1).toUpperCase() + input.substring(1);
        }
    }).filter('capslock', function() {
        return function(input, scope) {
            if (input != null) return input.toUpperCase();
            else return null;
        }
    }).directive('capitalize', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, modelCtrl) {
                var capitalize = function(inputValue) {
                    if (inputValue == undefined) inputValue = '';
                    var capitalized = inputValue.toUpperCase();
                    if (capitalized !== inputValue) {
                        modelCtrl.$setViewValue(capitalized);
                        modelCtrl.$render();
                    }
                    return capitalized;
                }
                modelCtrl.$parsers.push(capitalize);
                capitalize(scope[attrs.ngModel]); // capitalize initial value
            }
        };
    })
    // this is used for SEO
    .directive('ngContent', [
        function() {
            return {
                link: function($scope, $el, $attrs) {
                    $scope.$watch($attrs.ngContent, function(value) {
                        $el.attr('content', value);
                    });
                }
            };
        }
    ]).factory('BadgeAlerts', function() {
        var objSet = new Set();
        var MISSING_BETA_CODE = "beta_code_missing";
        objSet.MISSING_BETA_CODE = "beta_code_missing";
        objSet.IS_MISSING_BETA_CODE = function() {
            return this.contains(MISSING_BETA_CODE);
        }
        return objSet;
    }).directive('scrollOnClick', function($timeout, $window) {
        return {
            restrict: 'A',
            link: function($scope, $elm, $attrs) {
                $elm.bind('click', function($event) {
                    var target = $event.currentTarget;
                    if (angular.isUndefined(target))
                        return;
                    // we want something like -40 or 35 not -40px or 35%
                    var offset = parseInt($attrs.scrollOnClick.replace(/(A-Za-z|%)+/g, ''));
                    var y = $(target).offset().top + offset;

                    $('html, body').animate({
                        scrollTop: y
                    }, 'slow');

                    //document.body.scrollTop
                    $(target).focus();
                });
            }
        };
    }).directive('scrollOnClickMobile', function($timeout, $window) {
        return {
            restrict: 'A',
            link: function($scope, $elm, $attrs) {
                //block non mobile
                if (!$.browser.mobile)
                    return;
                $elm.bind('click', function($event) {
                    var target = $event.currentTarget;
                    if (angular.isUndefined(target))
                        return;
                    // we want something like -40 or 35 not -40px or 35%
                    var offset = parseInt($attrs.scrollOnClick.replace(/(A-Za-z|%)+/g, ''));
                    var y = $(target).offset().top + offset;

                    $('html, body').animate({
                        scrollTop: y
                    }, 'slow');
                    $(target).focus();
                });
            }
        };
    });




app.directive('blurCurrency', function($filter) {
    function link(scope, el, attrs, ngModelCtrl) {

        function formatter(value) {
            if (angular.isUndefined(value)) {
                return undefined;
            }
            value = parseFloat(value.toString().replace(/[^0-9_-]/g, ''));
            var formattedValue = $filter('currency')(value);
            el.val(formattedValue);
            return formattedValue;
        }
        ngModelCtrl.$formatters.push(formatter);

        el.bind('focus', function() {
            el.val('');
        });

        el.bind('blur', function() {
            formatter(el.val());
        });
    }

    return {
        require: '^ngModel',
        scope: true,
        link: link
    };
});

/* Global Functions */

function chunk(arr, size) {
    var newArr = [];
    for (var i = 0; i < arr.length; i += size) {
        newArr.push(arr.slice(i, i + size));
    }
    return newArr;
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function Set(hashFunction) {
    this._hashFunction = hashFunction || JSON.stringify;
    this._values = {};
    this._size = 0;
}


// beacuse ie doesnt implement everything
Set.prototype = {
    add: function add(value) {
        if (!this.contains(value)) {
            this._values[this._hashFunction(value)] = value;
            this._size++;
        }
    },

    remove: function remove(value) {
        if (this.contains(value)) {
            delete this._values[this._hashFunction(value)];
            this._size--;
        }
    },

    contains: function contains(value) {
        return typeof this._values[this._hashFunction(value)] !== "undefined";
    },

    size: function size() {
        return this._size;
    },

    each: function each(iteratorFunction, thisObj) {
        for (var value in this._values) {
            iteratorFunction.call(thisObj, this._values[value]);
        }
    }
};
