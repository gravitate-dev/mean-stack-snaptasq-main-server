'use strict';
var app = angular.module('snaptasqApp', ['bcherny/formatAsCurrency', 'slick', 'angularMoment', 'LocalStorageModule', 'seo', 'smoothScroll', 'FBAngular', 'ezfb', 'djds4rce.angular-socialshare', 'ngDisqus', 'ui-notification', 'pasvaz.bindonce', 'uiGmapgoogle-maps', 'ngAutocomplete', 'commentBox', 'iso.directives', 'ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', /*'btford.socket-io',*/ 'ui.bootstrap', 'ngAnimate', 'ngNotificationsBar', 'vcRecaptcha'])
    .config(["$routeProvider", function($routeProvider) {
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

    }])
    .config(["$locationProvider", "$httpProvider", "$animateProvider", "notificationsConfigProvider", function($locationProvider, $httpProvider, $animateProvider, notificationsConfigProvider) {
        //To fix carousel with ngAnimate
        $animateProvider.classNameFilter(/carousel/);
        $locationProvider.html5Mode(true).hashPrefix('!');
        $httpProvider.interceptors.push('authInterceptor');
        notificationsConfigProvider.setAcceptHTML(true);

        /**
         * SEO Interceptor that waits .7 seconds until no more requests then it will render
        *
        var $http,
                interceptor = ['$q', '$injector', function ($q, $injector) {
                    var error;
                    function success(response) {
                        $http = $http || $injector.get('$http');
                        var $timeout = $injector.get('$timeout');
                        var $rootScope = $injector.get('$rootScope');
                        if($http.pendingRequests.length < 1) {
                            $timeout(function(){
                                if($http.pendingRequests.length < 1){
                                    $rootScope.htmlReady();
                                }
                            }, 700);//an 0.7 seconds safety interval, if there are no requests for 0.7 seconds, it means that the app is through rendering
                        }
                        return response;
                    }

                    function error(response) {
                        $http = $http || $injector.get('$http');

                        return $q.reject(response);
                    }

                    return function (promise) {
                        return promise.then(success, error);
                    }
                }];

            $httpProvider.interceptors.push(interceptor);
            */

    }]).run(["$FB", "ezfb", function($FB, ezfb) {
        //$FB.init('764169247036130');
        ezfb.init({
            // This is my FB app id for plunker demo app
            appId: '764169247036130'
        });
    }])
    .factory('authInterceptor', ["$rootScope", "$q", "$cookieStore", "$location", function($rootScope, $q, $cookieStore, $location) {
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
    }])
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
    .run(["$rootScope", "$location", "$timeout", "$window", "Auth", "KeyEventService", function($rootScope, $location, $timeout, $window, Auth, KeyEventService) {
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
                console.log("Bruh");
                $('html, body').animate({
                    scrollTop: 0
                }, 'slow');
            }

        })
    }]);

function GlobalCtrl($scope, BadgeAlerts, localStorageService, $q, $templateCache, PageSeo, smoothScroll, $interval, notifications, $http, $anchorScroll, Auth, User, $location, $rootScope) {
    $scope.scrollTop = function() {
        $('html, body').animate({
            scrollTop: 0
        }, 'slow');
    }
    $scope.Page = PageSeo;
    //PageSeo.setTitle("GlobalCtrl");
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
                console.log($scope.viewport)
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
}
GlobalCtrl.$inject = ["$scope", "BadgeAlerts", "localStorageService", "$q", "$templateCache", "PageSeo", "smoothScroll", "$interval", "notifications", "$http", "$anchorScroll", "Auth", "User", "$location", "$rootScope"];;

app.controller('GlobalCtrl', GlobalCtrl)
    .filter("typeAheadNoResultsOnEmpty", function() {
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
    ]).factory('PageSeo', function() {
        var obj = {
            title: 'SnapTasq',
            description: 'SnapTasq is a new trendy way to group source your errands, tasks, chores to the friends you know and trust to get the job done.'
        }
        return {
            title: function() {
                return obj.title;
            },
            setTitle: function(newTitle) {
                console.log("Setting title to " + newTitle);
                obj.title = newTitle
            },
            description: function() {
                return obj.description;
            },
            setDescription: function(newDescription) {
                obj.description = newDescription
            },
        };
    }).factory('BadgeAlerts', function() {
        var objSet = new Set();
        var MISSING_BETA_CODE = "beta_code_missing";
        objSet.MISSING_BETA_CODE = "beta_code_missing";
        objSet.IS_MISSING_BETA_CODE = function() {
            return this.contains(MISSING_BETA_CODE);
        }
        return objSet;
    }).directive('scrollOnClick', ["$timeout", "$window", function($timeout, $window) {
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
    }]).directive('scrollOnClickMobile', ["$timeout", "$window", function($timeout, $window) {
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
    }])

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

'use strict';
angular.module('snaptasqApp').controller('PrivacyCtrl', ["$scope", "$http", "$window", function($scope, $http, $window) {
    $window.scrollTo(0, 0);
}]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/privacy', {
                templateUrl: 'app/ToS/privacy/privacy.html',
                controller: 'PrivacyCtrl'
            });
    }]);

'use strict';
angular.module('snaptasqApp').controller('TermsCtrl', ["$scope", "$http", "$window", function($scope, $http, $window) {
    $window.scrollTo(0, 0);
}]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/terms', {
                templateUrl: 'app/ToS/terms/terms.html',
                controller: 'TermsCtrl'
            });
    }]);

'use strict';
angular.module('snaptasqApp').controller('AboutUsCtrl', ["$scope", "$http", "$window", function($scope, $http, $window) {
    $window.scrollTo(0, 0);
}]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/about', {
                templateUrl: 'app/aboutus/aboutus.html',
                controller: 'AboutUsCtrl'
            });
    }]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
        /**
         * Sign in without action specified
         * Goes to login
         **/
            .when('/signin', {
                templateUrl: 'app/account/signin/signin.html',
                controller: 'SigninCtrl'
            })
            /**
             * Sign in,
             * action - login, register
             **/
            .when('/signin/:action', {
                templateUrl: 'app/account/signin/signin.html',
                controller: 'SigninCtrl',
                reloadOnSearch: false
            })
            .when('/connect', {
                templateUrl: 'app/account/connect/connect.html',
                controller: 'ConnectCtrl',
                authenticate: true
            })
            .when('/settings', {
                templateUrl: 'app/account/settings/settings.html',
                controller: 'SettingsCtrl',
                authenticate: true
            })
            .when('/resetPassword/:code1/:code2', {
                templateUrl: 'app/account/resetPassword/resetPassword.html',
                controller: 'ResetPasswordCtrl'
            })
            .when('/beta', {
                templateUrl: 'app/account/beta/beta.html',
                controller: 'BetaCtrl',
                authenticate: true
            })
            .when('/rewards', {
                templateUrl: 'app/account/rewards/rewards.html',
                controller: 'RewardsCtrl',
                authenticate: true
            })
            .when('/notifications', {
                templateUrl: 'app/account/notifications/notifications.html',
                controller: 'NotificationsCtrl',
                authenticate: true
            });
    }]);

'use strict';

angular.module('snaptasqApp')
    .controller('BetaCtrl', ["$scope", "BadgeAlerts", "$window", "$interval", "$location", "$timeout", "Beta", "User", "notifications", "Notification", function($scope, BadgeAlerts, $window, $interval, $location, $timeout, Beta, User, notifications, Notification) {

        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.errors = {};
        $scope.betaCode = "";
        $scope.$watch('_me', function(newval) {
            if ($scope._me && !$scope._me.requiresBeta) {
                $location.path('/tasks/mine');
            }
        });

        $scope.checkbeta = function(form) {

            User.applyBetaCode({}, {
                id: form.betaCode.$viewValue
            }, function(success) {
                notifications.showSuccess({
                    message: success.message
                });
                BadgeAlerts.remove(BadgeAlerts.MISSING_BETA_CODE);

                $timeout(function() {
                    $window.location.reload();
                }, 1000);

            }, function(error) {
                Notification.error(error.data.message);
            });
        }
    }]);

'use strict';

angular.module('snaptasqApp')
    .controller('ConnectCtrl', ["$scope", "Auth", "$location", "$timeout", "User", "$window", "$http", "notifications", function($scope, Auth, $location, $timeout, User, $window, $http, notifications) {
        $scope.user = {};
        $scope.errors = {};

        $scope.currentUser = {};
        /**
         * If the user is both verified and connected with facebook this page will be blank
         * Its best to redirect them to the tasks!
         **/
        var temp = new User(Auth.getCurrentUser());
        temp.$promise.then(function(data) {
            if (data.isConnectedWithFb && data.verification.status) {
                $location.path('/tasks');
            }
            $scope.currentUser = data;
        });

        //maybe a wierd race condition?
        $timeout(function() {
            var temp = new User(Auth.getCurrentUser());
            temp.$promise.then(function(data) {
                if (data.isConnectedWithFb && data.verification.status) {
                    $location.path('/tasks');
                }
                $scope.currentUser = data;
            });
        }, 1000)

        $scope.sendVerificationEmail = function(form) {
            Auth.sendVerificationEmail(form.captchaResponse.$viewValue, function(success) {
                notifications.showSuccess({
                    message: 'Sent. Please check your inbox, ' + $scope.currentUser.email
                });
                grecaptcha.reset();
            }, function(fail) {
                //TODO: When email fails handle the case
                if (fail.data.status && fail.data.status == "warn")
                    notifications.showWarning({
                        message: fail.data.message
                    });
                else
                    notifications.showError({
                        message: fail.data.message
                    });
            });
        }
        $scope.connect = function() {
            $window.location.href = '/auth/facebook';
        };
    }]);

'use strict';
angular.module('snaptasqApp').controller('ForgotCtrl', ["$scope", "vcRecaptchaService", "User", "Auth", "notifications", function($scope, vcRecaptchaService, User, Auth, notifications) {
    $scope.errors = {};

    $scope.resetCaptcha = function() {
        vcRecaptchaService.reload();
    };
    $scope.sendForgotPassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            $scope.submitted = false;
            Auth.sendForgotPasswordEmail(form.captchaResponse.$viewValue, form.email.$viewValue, function(success) {
                notifications.showSuccess({
                    message: 'Check your inbox! We sent you a reset password email to ' + $scope.email
                });
                $scope.resetCaptcha();
            }, function(fail) {
                $scope.resetCaptcha();
                if (fail.data.status && fail.data.status == "warn") notifications.showWarning({
                    message: fail.data.message
                });
                else notifications.showError({
                    message: fail.data.message
                });
                $scope.errors.other = fail.data.message
            });
        }
    }
}]);

'use strict';
angular.module('snaptasqApp').controller('NotificationsCtrl', ["$scope", "Notify", "$interval", function($scope, Notify, $interval) {
    $scope.notifications = [];
    $interval(function() {
        Notify.get(function(notifications) {
            $scope.notifications = notifications;
        });
    }, 5000);
    Notify.get(function(notifications) {
        $scope.notifications = notifications;
    });

}]);

'use strict';
angular.module('snaptasqApp').controller('ResetPasswordCtrl', ["$scope", "$timeout", "User", "Auth", "notifications", "$routeParams", function($scope, $timeout, User, Auth, notifications, $routeParams) {
    $scope.errors = {};
    $scope.resetCode1 = "";
    $scope.resetCode2 = "";
    if (angular.isUndefined($routeParams.code1) || angular.isUndefined($routeParams.code2)) {
        notifications.showError({
            message: "Invalid change password link. Check your email again."
        });
        $scope.message = "Invalid change password link. Check your email again.";
    } else {
        $scope.resetCode1 = $routeParams.code1;
        $scope.resetCode2 = $routeParams.code2;
    }

    $scope.resetChangePassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            Auth.resetChangePassword($scope.user.newPassword, $scope.resetCode1, $scope.resetCode2, function(success) {
                $scope.message = '';
                notifications.showSuccess({
                    message: 'Password successfully changed.'
                });
                $scope.submitted = false;
                $scope.user.newPassword = "";
                form.$setPristine();
                $timeout(function() {
                    $location.path('/');
                }, 2000);
            }, function(fail) {
                $scope.message = 'Invalid change password link. Check your email again.';
                notifications.showError({
                    message: "Invalid change password link. Check your email again."
                });
            });
        }
    };
}]);

'use strict';

angular.module('snaptasqApp')
    .controller('RewardsCtrl', ["$scope", "$window", "$interval", "$location", "$timeout", "User", "notifications", "Notification", function($scope, $window, $interval, $location, $timeout, User, notifications, Notification) {
        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.errors = {};
        $scope.betaCode = "";

        $scope.rewards = [];
        var amazon = {
            title: "5$ Amazon Digital Gift Card",
            status: "OPEN",
            description: "app/account/rewards/rewardInstructions/reward.amazon.html"
        };
        $scope.rewards.push(amazon);
        var tshirt = {
            title: "SnapTasq T-shirt",
            status: "OPEN",
            description: "app/account/rewards/rewardInstructions/reward.tshirt.html"
        };
        $scope.rewards.push(tshirt);
    }]);

'use strict';
angular.module('snaptasqApp').controller('SettingsCtrl', ["$scope", "Task", "$window", "$location", "$timeout", "Modal", "User", "Auth", "notifications", function($scope, Task, $window, $location, $timeout, Modal, User, Auth, notifications) {
    $scope.errors = {};

    $scope.currentUser = new User(Auth.getCurrentUser());
    $scope.userCanFbConnect = false;

    var unbindWatchingMe = $scope.$watch('_me', function(newVal) {
        if (angular.isUndefined(newVal)) return;
        $scope.userCanFbConnect = !$scope._me.isConnectedWithFb;
    });

    $scope.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };

    $scope.showDeleteAccountModal = function() {
        Modal.confirm.delete(function(data) {
            Auth.deleteMyAccount(function(data) {
                notifications.showSuccess({
                    message: 'Your account has been deleted.'
                });
                $timeout(function() {
                    $window.location.reload();
                }, 2000)
            }, function(data) {
                notifications.showError({
                    message: 'Please login again first to delete.'
                });
            });
        })("your account");

    };
    $scope.changePassword = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword).then(function() {
                notifications.showSuccess({
                    message: 'Password successfully changed.'
                });
                $scope.submitted = false;
                $scope.user.oldPassword = "";
                $scope.user.newPassword = "";
                form.$setPristine();
            }).
            catch(function() {
                form.password.$setValidity('mongoose', false);
                $scope.errors.other = 'Incorrect password';
                $scope.message = '';
            });
        }
    };

    $scope.sendForgotPassword = function(form) {
        Auth.sendVerificationEmail(form.captchaResponse.$viewValue, function(success) {
            notifications.showSuccess({
                message: 'Check your inbox! We sent you a reset password email to ' + $scope.currentUser.email
            });
            grecaptcha.reset();
        }, function(fail) {
            //TODO: When email fails handle the case
            if (fail.data.status && fail.data.status == "warn")
                notifications.showWarning({
                    message: fail.data.message
                });
            else
                notifications.showError({
                    message: fail.data.message
                });
        });
    }
}]);

'use strict';

angular.module('snaptasqApp')
    .controller('SigninCtrl', ["$scope", "Beta", "$routeParams", "$timeout", "Task", "TaskMarshaler", "Auth", "$location", "$window", "notifications", "vcRecaptchaService", "$rootScope", function($scope, Beta, $routeParams, $timeout, Task, TaskMarshaler, Auth, $location, $window, notifications, vcRecaptchaService, $rootScope) {
        $scope.handleParams = function() {
            if ($routeParams.action) {
                if ($routeParams.action == "register") {
                    $scope.setViewRegistration();
                } else {
                    $scope.tabSignup = true;
                    $scope.tabCreateAccount = false;
                }
            }
        }

        $scope.setViewRegistration = function() {
            $scope.tabSignup = false;
            $scope.tabCreateAccount = false;
            $scope.tabCreateAccount = true;
        }
        $scope.$on('$routeUpdate', function() {
            $scope.handleParams();
        });
        $scope._bgcolorSnapYellow();
        $scope._noFooter();
        $scope.user = {};
        $scope.errors = {};
        $scope.registerErrors = [];

        $scope.handleParams();
        $scope.resetCaptcha = function() {
            vcRecaptchaService.reload();
        };

        function onRegisterFail(form, fail) {
            $scope.resetCaptcha();
            if (fail.data.status && fail.data.status == "warn")
                notifications.showWarning({
                    message: fail.data.message
                });
            else
                notifications.showError({
                    message: fail.data.message
                });
        }

        function onRegisterSuccess(user, emailAddress) {
            notifications.showSuccess({
                message: 'Verification Email Sent. Please check your inbox, ' + emailAddress
            });
            handleTaskPostAuthenticate(user);
        };
        $scope.register = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                Auth.createUser(form.captchaResponse.$viewValue, {
                        name: form.name.$viewValue,
                        email: form.email.$viewValue,
                        password: form.password.$viewValue
                    }, function(user) {
                        onRegisterSuccess(user, form.email.$viewValue)
                    }, function(fail) {
                        onRegisterFail(form, fail);
                    })
                    .catch(function(err) {
                        var err = err.data;
                        $scope.registerErrors = [];
                        angular.forEach(err.errors, function(error, field) {
                            console.log(error.message);
                            //form[field].$setValidity('mongoose', false);
                            $scope.registerErrors.push(field + ": " + error.message);
                        });
                    });
            }
        };

        $scope.loginOauth = function(provider) {
            $window.location.href = '/auth/' + provider;
        };

        var handleTaskPostAuthenticate = function(user) {
            // in order to refresh the badges we do this here
            $rootScope.$broadcast('user.state_change', {});
            if (user.requiresBeta && $scope._beta) {
                $location.path('/beta');
            } else {
                if (TaskMarshaler.hasTask()) {
                    $location.path("/task/create");
                } else {
                    $location.path('/');
                }
            }
        }
        $scope.login = function(form) {

            $scope.submitted = true;
            if (form.$valid) {
                Auth.login({
                        email: $scope.user.email,
                        password: $scope.user.password
                    })
                    .then(function(response) {
                        handleTaskPostAuthenticate(response.user);
                    })
                    .catch(function(err) {
                        $scope.errors.other = err.message;
                    });
            }
        };
    }]);

'use strict';

angular.module('snaptasqApp')
    .controller('AdminCtrl', ["$scope", "$http", "Auth", "User", function($scope, $http, Auth, User) {

        // Use the User $resource to fetch all users
        $scope.users = User.query();

        $scope.delete = function(user) {
            User.remove({
                id: user._id
            });
            angular.forEach($scope.users, function(u, i) {
                if (u === user) {
                    $scope.users.splice(i, 1);
                }
            });
        };
    }]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/admin/users', {
                templateUrl: 'app/admin/admin.html',
                controller: 'AdminCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/community', {
                templateUrl: 'app/admin/community/community.html',
                controller: 'AdminCommunityCtrl',
                authenticate: true,
                adminRequired: true,
            })
            .when('/admin/beta', {
                templateUrl: 'app/admin/beta/beta.html',
                controller: 'AdminBetaCtrl',
                authenticate: true,
                adminRequired: true,
            });
    }]);

'use strict';

angular.module('snaptasqApp')
    .controller('AdminBetaCtrl', ["$scope", "$http", "Auth", "User", "Beta", "Notification", function($scope, $http, Auth, User, Beta, Notification) {
        $scope.betaCodes = [];
        $scope.betaCode = undefined
        $scope.codeUses = 0;
        $scope.codePrefix = "SNAP"
        $scope.$watch('codePrefix', function(newval) {
            $scope.generatePreviewCode();
        });

        $scope.refreshBetas = function() {
            Beta.get(function(data) {
                $scope.betaCodes = data;
            });
        }
        $scope.refreshBetas();

        $scope.activate = function(beta) {
            Beta.activate({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is now active");
                $scope.refreshBetas();
            });
        };

        $scope.deactivate = function(beta) {
            Beta.deactivate({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is now inactive");
                $scope.refreshBetas();
            });
        };

        $scope.delete = function(beta) {
            Beta.delete({
                id: beta._id
            }, {}, function(data) {
                Notification.success("Beta code is deleted");
                $scope.refreshBetas();
            })
        }

        $scope.generatePreviewCode = function() {
            var code = $scope.codePrefix;
            var missingCharacters = 16 - code.length;
            if (missingCharacters > 0)
                code += randomString(missingCharacters, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            $scope.previewCode = code;
        }
        $scope.generateBetaCode = function(form) {
            $scope.generatePreviewCode();
            var maxUses = form.codeUses.$viewValue;
            var prefix = form.codePrefix.$viewValue;
            if (angular.isUndefined(maxUses) || maxUses > 100 || maxUses == 0) {
                alert("Beta code maxUses must be between 1-100");
                return;
            }

            if (!angular.isUndefined(prefix) && prefix.length > 10) {
                alert("Beta code prefix too long. Only 10 digits max");
                return;
            }

            Beta.generateCode({}, {
                maxUses: maxUses,
                name: $scope.previewCode
            }, function(data) {
                Notification.success({
                    message: "Beta code generated!",
                    delay: 5000
                });
                $scope.submitted = false;
                $scope.betaCode = data;
                form.$setPristine();

                Beta.get(function(data) {
                    $scope.betaCodes = data;
                });
            }, function(err) {
                if (err && err.data && err.data.message)
                    Notification.error({
                        message: "Failed to create beta code " + err.data.message,
                        delay: 5000
                    });
                else {
                    Notification.error({
                        message: "Failed to create beta code",
                        delay: 5000
                    });
                }
            });
        };
    }]);

'use strict';

angular.module('snaptasqApp')
    .controller('AdminCommunityCtrl', ["$scope", "$http", "Auth", "Community", "Notification", function($scope, $http, Auth, Community, Notification) {

        $scope.name = "";
        $scope.entryMethods = [{
            id: 1,
            name: 'open'
        }, {
            id: 2,
            name: 'email'
        }, {
            id: 2,
            name: 'area code'
        }];
        $scope.communities = [];
        $scope.submitted = false;
        $scope.createCommunity = function(form) {
            $scope.submitted = true;
            if (form.$valid) {

                var data = {
                    name: form.name.$viewValue,
                    entryMethod: form.entryMethod.$viewValue.name,
                    entryParam: form.entryParam.$viewValue
                };

                Community.create(data, function(data) {
                    Notification.success("Created");
                    $scope.listCommunities();
                })
            }
        }

        $scope.listCommunities = function() {
            Community.get({}, function(data) {
                $scope.communities = data;
            })
        }
        $scope.listCommunities();

        $scope.delete = function(community) {
            Community.delete(community._id, function(data) {
                console.log(data);
                $scope.listCommunities();
            });
        }
    }]);

'use strict';
angular.module('snaptasqApp').controller('CommunitiesCtrl', ["$scope", "Community", "$http", "$window", function($scope, Community, $http, $window) {
    $scope._bgcolorSnapYellow();
    $scope._noFooter();
    $scope.requestBetaErrors = [];

    $scope.showSuggestCommunityModal = function() {

    };


    $scope.listCommunities = function() {
        Community.get({
            entryMethod: "open"
        }, function(data) {
            $scope.publicCommunities = data;
        });
        Community.get({
            entryMethod: "open"
        }, function(data) {
            $scope.publicCommunities = data;
        });
        $scope.publicCommunities = data;
    }
    $scope.listCommunities();
    $scope.communities = [{
        name: "Santa Clara University"
    }, {
        name: "Santa Clara"
    }, {
        name: "Walsh"
    }, ];
    /*
    , {
            name: "Santa Clara"
        }, {
            name: "San Jose"
        }, {
            name: "Bay Area"
        }, {
            name: "pets"
        },
        */
}]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/communities', {
                templateUrl: 'app/communities/communities.html',
                controller: 'CommunitiesCtrl',
                authenticate: true,
            });
    }]);

'use strict';
angular.module('snaptasqApp').controller('MainCtrl', ["$scope", "$http", "$interval", "$location", "notifications", "TaskMarshaler", function($scope, $http, $interval, $location, notifications, TaskMarshaler) {
    $scope.top_image = {
        minHeight: "750px",
        paddingTop: "200px"
    }

    $scope.slickSliderImageWidth = "100%";
    $scope.$watch('viewport', function(newVal, oldVal) {
        if (angular.isUndefined(newVal)) return;
        if (newVal == "xs" || newVal == "sm") {
            //mobile
            $scope.slickSliderImageWidth = "100%";
            $scope.top_image = {
                minHeight: "750px",
                paddingTop: "100px"
            };
        } else {
            //desktop, tablet
            $scope.slickSliderImageWidth = "50%";
            $scope.top_image = {
                minHeight: "750px",
                paddingTop: "200px"
            };
        }
    }, true);
    $scope.handleSearch = function($item, $model, $label) {
        var task = TaskMarshaler.createDefaultTask($item);
        TaskMarshaler.setTask(task);
        $location.path("/task/create");
    }

    $scope.launchTaskCreateWithName = function(taskName) {
        var temp = {
            name: taskName
        };
        var task = TaskMarshaler.createDefaultTask(temp);
        TaskMarshaler.setTask(task);
        $location.path("/task/create");
    }
    $scope.searchTask = "";
    // removed  image: "assets/bubbleHeads/need_kids_pick_up/model.png"}
    $scope.slides = [{
        image: "assets/bubbleHeads/need_ride/model.png"
    }, {
        image: "assets/bubbleHeads/need_a_drink/model.png"
    }, ];
    $scope.commonTasks = [{
        name: "Arts and Crafts"
    }, {
        name: "Assemble Furniture"
    }, {
        name: "Assemble IKEA Furniture"
    }, {
        name: "Bartending"
    }, {
        name: "Bathroom Cleaning"
    }, {
        name: "Baby Sitting"
    }, {
        name: "Cabinet Cleaning"
    }, {
        name: "Carpentry"
    }, {
        name: "Carpentry & Construction"
    }, {
        name: "Carpet Cleaning"
    }, {
        name: "Construction"
    }, {
        name: "Cooking"
    }, {
        name: "Cooking & Baking"
    }, {
        name: "Customized Building"
    }, {
        name: "Decoration Help"
    }, {
        name: "Deep Clean"
    }, {
        name: "Deliver Big Piece of Furniture"
    }, {
        name: "Delivery Service"
    }, {
        name: "Disassemble furniture"
    }, {
        name: "Dog Walking"
    }, {
        name: "Drop Off Donations"
    }, {
        name: "Electrical Work"
    }, {
        name: "Entertain Guests"
    }, {
        name: "Event Decorating"
    }, {
        name: "Event Help & Wait Staff"
    }, {
        name: "Event Marketing"
    }, {
        name: "Event Planning"
    }, {
        name: "Event Staffing"
    }, {
        name: "Floor Cleaning"
    }, {
        name: "Food Run"
    }, {
        name: "Furniture Shopping & Assembly"
    }, {
        name: "Gardening"
    }, {
        name: "General Cleaning"
    }, {
        name: "General Handyman"
    }, {
        name: "General Moving Help"
    }, {
        name: "Graphic Design"
    }, {
        name: "Grocery Shopping"
    }, {
        name: "Hang Pictures"
    }, {
        name: "Heavy Lifting"
    }, {
        name: "Help Cooking & Serving Food"
    }, {
        name: "Help With Dirty Dishes"
    }, {
        name: "Home Cleaning"
    }, {
        name: "Kitchen Cleaning"
    }, {
        name: "Laundry Help"
    }, {
        name: "Light Installation"
    }, {
        name: "Move Furniture"
    }, {
        name: "Organization"
    }, {
        name: "Organize Closet"
    }, {
        name: "Organize Home"
    }, {
        name: "Organize Paperwork"
    }, {
        name: "Organize a Room"
    }, {
        name: "Pack for a Move"
    }, {
        name: "Pet Sitting"
    }, {
        name: "Personal Assistant"
    }, {
        name: "Photography"
    }, {
        name: "Pick Up & Delivery"
    }, {
        name: "Rearrange Furniture"
    }, {
        name: "Remove Furniture"
    }, {
        name: "Remove Heavy Furniture"
    }, {
        name: "Return Items"
    }, {
        name: "Returns"
    }, {
        name: "Run Errands"
    }, {
        name: "Shelf Mounting"
    }, {
        name: "Shop For & Install Decorations"
    }, {
        name: "Shopping"
    }, {
        name: "Shopping Returns"
    }, {
        name: "TV Mounting"
    }, {
        name: "Take Furniture Apart & Move It"
    }, {
        name: "Unpack & Organize"
    }, {
        name: "Usability Testing"
    }, {
        name: "Wait for Delivery"
    }, {
        name: "Wait in Line"
    }, {
        name: "Web Design"
    }, {
        name: "Web Design & Development"
    }, {
        name: "Writing & Editing"
    }, {
        name: "Washing Car"
    }, {
        name: "Yard Work & Removal"
    }];


    $scope.advertisedTasks = [{
        name: "pet sitting",
        prefill: "Need someone to watch Rover for an hour",
        img: "assets/images/panel-images/tasq1.png"
    }, {
        name: "moving",
        prefill: "Need help moving furniture to my new dorm",
        img: "assets/images/panel-images/tasq2.png"
    }, {
        name: "food run",
        prefill: "Can someone bring me ikes to b4",
        img: "assets/images/panel-images/foodRun.png"
    }, {
        name: "dorm cleaning",
        prefill: "Can anyone clean my dorm?",
        img: "assets/images/panel-images/cleaning.png"
    }, {
        name: "shopping & delivery",
        prefill: "I need someone to pick up groceries",
        img: "assets/images/panel-images/tasq5.png"
    }, {
        name: "transportation",
        prefill: "Can anyone pick me up at X",
        img: "assets/images/panel-images/tasq6.png"
    }];

}]).controller('MainCarouselCtrl', ["$scope", function($scope) {
    $scope.myInterval = 5000;
    $scope.getActiveSlide = function() {
        return $scope.slides.filter(function(s) {
            return s.active;
        })[0];
    };
    $scope.slides = [{
        text: "tutor me",
        image: "assets/images/stockpics/dark/tutoring.jpg"
    }, {
        text: "do my shopping",
        image: "assets/images/stockpics/dark/groceryShopping.jpg"
    }, {
        text: "pick up my food",
        image: "assets/images/stockpics/dark/foodDelivery.jpg"
    }, {
        text: "walk my dog",
        image: "assets/images/stockpics/dark/dogWalking.jpg"
    }, {
        text: "help me move",
        image: "assets/images/stockpics/dark/moving.jpg"
    }, {
        text: "wash my car",
        image: "assets/images/stockpics/dark/washingCar.jpg"
    }];
}]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl',
            });
    }]);

'use strict';
angular.module('snaptasqApp')
    .controller('PricePointsModalCtrl', ["$scope", "Modal", function($scope, Modal) {

    }])
    .service('pricePointService', function() {

        var FREE = 0;
        var SMALL = 1;
        var MED = 2;
        var BIG = 3;

        // Define your variable
        function _level(p) {
            if (isFree(p)) return FREE;
            else if (isSmall(p)) return SMALL;
            else if (isMedium(p)) return MED;
            else if (isBig(p)) return BIG;
            //this will never happen but i return free anyways
            return this.FREE;
        }

        function asString(p) {
            var l = _level(p);
            switch (l) {
                case FREE:
                    return "free";
                case SMALL:
                    return "small";
                case MED:
                    return "medium";
                case BIG:
                    return "big";
                default:
                    return "free";
            }
        }

        function asInteger(p) {
            return _level(p);
        }

        function isFree(p) {
            if (angular.isUndefined(p) || p == null || p == 0) return true;
            return false;
        }

        function isSmall(p) {
            if (angular.isUndefined(p)) return false;
            return (p > 0 && p <= 10)
        }

        function isMedium(p) {
            if (angular.isUndefined(p)) return false;
            return (p > 10 && p <= 20)
        }

        function isBig(p) {
            if (angular.isUndefined(p)) return false;
            return (p > 20)
        }

        // Use the variable in your constants
        return {
            asInt: asInteger,
            asStr: asString
        }
    })
    .filter('pricePointCategory', ["pricePointService", function(pricePointService) {
        return function(amount, scope) {
            return pricePointService.asStr(amount);
        }
    }]);

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/pricePoints', {
                templateUrl: 'app/pricePoints/pricePoints.html'
            });
    }]);

'use strict';
angular.module('snaptasqApp').controller('RequestBetaCtrl', ["$scope", "Beta", "$http", "$window", function($scope, Beta, $http, $window) {
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
}]).directive('betaEmailSignUp', function() {
    return {
        restrict: 'ACE',
        // Replace the div with our template
        replace: false,
        template: '<div class="sendgrid-subscription-widget" data-message-success="Thank you. You will be emailed a beta code when we start our beta trials." data-submit-text="Request Beta Code" data-token="SAcCNqsWMVXRHCm7rnWYW0JG0Fg2Y%2BWPSWMRqnPS9LiJCHKEjYE4K3YeJRqW%2BkXz"></div>',
        controller: ["$scope", function($scope) {
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
        }],
        link: function(scope, element, attrs) {
            /*attrs.$observe('task', function(value) {
              if (value) {
                scope.task = value;
              }
            });*/
        }
    }
});

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
        $routeProvider
            .when('/requestBeta', {
                templateUrl: 'app/requestBeta/requestbeta.html',
                controller: 'RequestBetaCtrl'
            });
    }]);

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
        controller: ["$scope", function($scope) {}],
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
        controller: ["$scope", "Modal", "Task", function($scope, Modal, Task) {
            $scope.showApplicants = function(task) {
                Modal.view.applicants(function(data) {})(task);
            }

        }]
    };
});

'use strict';
angular.module('snaptasqApp')
    .controller('TasksCtrl', ["$scope", "_me", "notifications", "PageSeo", "Notification", "$location", "$window", "$routeParams", "Auth", "Task", "$timeout", "$interval", "User", "TaskMock", "KeyEventService", "TaskMarshaler", "Modal", "$rootScope", function($scope, _me, notifications, PageSeo, Notification, $location, $window, $routeParams, Auth, Task, $timeout, $interval, User, TaskMock, KeyEventService, TaskMarshaler, Modal, $rootScope) {
        $scope._me = _me;
        //console.log(_me);
        $scope.action = $routeParams.action;
        $scope.id = $routeParams.id;
        $scope.errors = {};

        $scope.loadTaskData = function() {
            if ($scope.id == undefined)
                return;
            Task.getById($scope.id, function(data) {
                $scope.task = data;
                $scope.task.locationCopy = _.clone(data.location, true);

                // change seo before we call ready
                //PageSeo.setTitle("Help out "+$scope.task.ownerName+ " with " + $scope.task.name);
                //PageSeo.setDescription($scope.task.description);
                $scope.htmlReady();

            }, function(err) {
                notifications.showError({
                    message: "This Task no longer exists. Because it was deleted by the owner."
                });
                $location.path('/tasks');
            });
        }
        $scope.$on('reloadTask', function() {
            if ($scope.id) {
                $scope.loadTaskData();
            }
        });

        $scope.task = {};
        var isNewTask = ($location.path().indexOf("create") != -1);
        if (isNewTask) {
            $scope.task = TaskMarshaler.getTask() || {};
        } else {
            //if we do have a non-default task but its not yet made we should
            //redirect them to the create
            if (TaskMarshaler.hasTask()) {
                $location.path('/task/create');
            }
            $scope.loadTaskData();
        }
        $scope.filter = {};
        //$scope.tasks = [];

        Task.countResponsibleTasks(function(count) {
            $rootScope.$broadcast('count.responsible', count);
        });
        $scope.typeTasks = $routeParams.type;
        if ($routeParams.type == "mine") {
            Task.getMyTasks(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else if ($routeParams.type == "applied") {
            Task.getMyAppliedTasks(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else if ($routeParams.type == "chosen") {
            Task.getTasksResponsible(function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        } else {
            Task.get({}, function(data) {
                $scope.tasks = data;
                _.each($scope.tasks, function(task) {
                    task.locationCopy = _.clone(task.location, true);
                });
            });
        }

        $scope.connect = function() {
            $window.location.href = '/auth/facebook';
        };

        $scope.canApplyToTask = function(task, me) {
            if (angular.isUndefined(me)) {
                return true;
            }
            if (task.ownerId == me._id)
                return false;
            //check to see if i am in the task.applicants
            var result = true;
            _.each(task.applicants, function(item) {
                if (item.id == me._id) {
                    result = false;
                }
            });
            return result;
        }

        $scope.canUnapplyToTask = function(task, me) {
            if (angular.isUndefined(me)) {
                return false;
            }
            if (task.ownerId == me._id)
                return false;
            //check to see if i am in the task.applicants
            var result = false;
            _.each(task.applicants, function(item) {
                if (item.id == me._id) {
                    result = true;
                }
            });
            return result;

        }
        $scope.unapplyToTask = function(task) {
            if (!Auth.isLoggedIn()) {
                $scope.connect();
                //Notification.warning({message: "Task Saved. Please signup or login to publish your task."});
                //$location.path("/login");
            } else {
                Task.unapplyToTask({
                    id: task._id
                }, {}, function(data) {
                    if (task.tasker.id == $scope._me.id) {
                        Notification.success({
                            message: "You are no longer a helper for this task."
                        });
                    } else {
                        notifications.showSuccess("You are no longer listed as a helper for this task.");
                    }
                    task.applicants = data.applicants;
                    task.tasker = data.tasker;
                });
            }
        }
        $scope.applyToTask = function(task) {
                if (!Auth.isLoggedIn()) {
                    $scope.connect();
                    //Notification.warning({message: "Task Saved. Please signup or login to publish your task."});
                    //$location.path("/login");
                } else {
                    Task.applyToTask({
                        id: task._id
                    }, {}, function(data) {
                        task.applicants = data.applicants;
                        task.tasker = data.tasker;
                    });
                }
            }
            /**
             * A chosen tasker will confirm they will do the task
             * They will call this to set the tasker to confirm:true
             * Task status is closed
             **/
        $scope.taskerConfirmTask = function(task, isAccepted) {
            Task.confirmTasker(task._id, isAccepted, function(data) {
                if (isAccepted == false) {
                    $scope.$emit("removeTaskById", task._id);
                    Notification.success({
                        message: "You are no longer a helper for this task."
                    });
                } else {
                    Notification.success({
                        message: "You can now help them"
                    });
                }
                angular.copy(data, task);
            });
        }
        $scope.showApplicants = function(task) {
            Modal.view.applicants(function(data) {})(task);
        }

        KeyEventService.register($scope).escape(function() {
            //$scope.deselectCurrentItem();
        });

        $scope.$on('removeTaskById', function(event, id) {
            for (var i = $scope.tasks.length - 1; i >= 0; i--) {
                if ($scope.tasks[i]._id == id) {
                    $scope.tasks.splice(i, 1);
                }
            }
        });

        $scope.display = {
            mode: "list"
        };
        //for (var i = 0; i < 50; i++) {
        //    $scope.xList.push(TaskMock.generate());
        //}
        /*
        $scope.myIsotope = angular.element('#isotopeContainer').scope();
        $scope.removeItem = function(index) {
            var s = angular.element('#isotopeContainer').scope();
            s.tasks.splice(index, 1);
            s.refreshIso();
            $scope.refreshIsotope();
        };
        $scope.selectedTask = undefined;
        $scope.refreshIsotope = function() {
            $timeout(function() {
                $scope.myIsotope.refreshIso();
            }, 1);
        }
        $scope.highlightItem = function($event, item) {
            if (!angular.isUndefined(item.selected) && item.selected==true){
                return;
            }
            if (!angular.isUndefined($scope.selectedTask)) {
                $scope.selectedTask.selected = false;
            }
            $scope.selectedTask = item;
            $scope.selectedTask.selected = true;
            $scope.refreshIsotope();
        };
        $scope.deselectCurrentItem = function() {
            if (angular.isUndefined($scope.selectedTask)) return;
            $scope.selectedTask.selected = false;
            $scope.refreshIsotope();
            $scope.refreshIsotope();
        }
        $scope.onCloseCommentBox = function(commentBox) {
            commentBox.selected = false;
            if (!angular.isUndefined($scope.selectedTask)) {
                $scope.selectedTask.selected = false;
            }
            $scope.refreshIsotope();
        }
        $scope.addToList = function() {
            var s = angular.element('#isotopeContainer').scope();
            s.count = s.count || 0;
            var newItem = {
                name: 'add',
                number: s.count--,
                date: Date.now(),
                class: 'purple'
            };
            s.tasks.push(newItem);
        }
        $interval(function() {
            //console.log("BEFORE");
            var s = angular.element('#isotopeContainer').scope();
            //console.log("AFTER");
            if (!angular.isUndefined(s) && !angular.isUndefined(s.refreshIso)){
                s.refreshIso();
                return;
            }
        }, 1000)
        */
    }])
    .controller('TaskEditCtrl', ["$scope", "Modal", "notifications", "$routeParams", "Task", "Notification", "$rootScope", "TaskMarshaler", "Auth", "$location", function($scope, Modal, notifications, $routeParams, Task, Notification, $rootScope, TaskMarshaler, Auth, $location) {
        /**
         * Task steps can be 
         * 1. taskform 2. community 3. share 4. finish
         **/
        $scope.uiStep = "taskform";
        $scope.taskId = undefined; // this will be set in Task.create
        $scope.changeStepTo = function(stepName) {
                if (stepName == "finish") {
                    if ($scope.taskId) {
                        $location.path("/task/view/" + $scope.taskId);
                    } else {
                        $location.path("/tasks/mine");
                    }
                }
                $scope.uiStep = stepName;
            }
            //$scope.task = $scope.task || TaskMarshaler.getTask() || {};
            // if the $scope.task is undefined this means its coming from the homepage
            // in that case DO NOT reassign the varaible
        if (angular.isUndefined($scope.task)) {
            //ONLY load this if the task is undefined from the parent controller, TasksCtrl
            $scope.task = TaskMarshaler.getTask() || {};
        }
        $scope.$watch('_me', function(user) {
            if (angular.isUndefined(user)) {
                return;
            }
            if (user.requiresBeta && window._beta) {
                $location.path('/beta');
            }
        });
        // its okay if users are not logged in to go here
        // its not okay if users are logged in and have not unlocked the beta
        $scope.errors = {};
        $scope.action = $routeParams.action;

        $scope.previousLocation = {};
        //case they edit a pre-existing location
        $scope.setEditor = function(task) {
            $scope.previousLocation = _.clone(task.location.name, true);
        }
        if ($scope.action == "update") {
            /** 
             * Fix for task location not appearing when loading an old tasq
             **/
            var unregister = $scope.$watch('task', function(newVal, oldVal) {
                if (angular.isUndefined(newVal)) return;
                if (angular.isUndefined(newVal.location)) return;
                $scope.setEditor(newVal);
                unregister();
            })
        }
        $scope.createTask = function(form) {
            $scope.submitted = true;

            if (form.$valid) {
                $scope.errors.location = undefined;
                if (angular.isUndefined($scope.previousLocation) == false) {
                    //first check that it wasnt changed
                    if ($scope.previousLocation != $scope.task.location.name) {
                        if (angular.isUndefined($scope.task.location.details)) {
                            //there will be a details object when the location is a valid one,
                            //after it was changed if its missing its an invalid location
                            $scope.errors.location = true;
                        }
                        //if the location was changed, then we need to
                        //clear the task location data
                    }
                }
                try {
                    //if the formattedName is in
                    $scope.task.location = TaskMarshaler.formatLocation($scope.task.location);
                } catch (e) {
                    //if location is wrong simply invalidate the location
                    $scope.errors.location = true;
                }
                if ($scope.errors.description || $scope.errors.location) {
                    return;
                }
                if (!Auth.isLoggedIn()) {
                    TaskMarshaler.setTask($scope.task);
                    notifications.showSuccess("Task Saved. Please signup or login to publish your task.");
                    $location.path("/signin");
                } else {
                    Task.create($scope.task,
                        function(data) {
                            var msg = undefined;
                            if ($scope.action == "update") {
                                msg = "Task updated.";
                            } else {
                                msg = "Task created.";
                            }
                            $scope.taskId = data._id;
                            Notification.success({
                                message: msg,
                                delay: 4000
                            });
                            TaskMarshaler.setTask(undefined);
                            $scope.changeStepTo("finish");
                        },
                        function(fail) {
                            notifications.showError({
                                message: "Please login first."
                            });
                        });
                }
            } else {
                //console.log("form invalid");
            }
        }

        $scope.showPricePoints = function() {
            Modal.view.pricePoints(function(data) {})();
        }

        $scope.deleteTask = function(t) {
            Task.delete(t._id, function(data) {
                Notification.success({
                    message: "Task removed",
                    delay: 4000
                });
                $location.path('/tasks/mine');
            }, function(err) {
                notifications.showError(err);
            });
        };
        $scope.cancelEditingTask = function() {
            $scope.task = undefined;
            TaskMarshaler.removeTask();
            if (Auth.isLoggedIn()) {
                $location.path("/tasks/mine");
            } else {
                $location.path("/");
            }
        }
    }]).controller('TaskApplicantList', ["$scope", "Task", "Notification", "$rootScope", function($scope, Task, Notification, $rootScope) {
        $scope.setTasker = function(task, applicantId) {
            Task.setTasker(task._id, applicantId, function(data) {
                Notification.success({
                    message: "Your tasker has been chosen, and will be notified"
                });
                //task = angular.copy(data);
                //angular.copy(data,task);  //This will work as angular creates a deep copy
                //task = data; // this wont work at all
                task.tasker = data.tasker; // this will work as it assigns a property rather than the whole object
                task.status = data.status;
                $scope.success();
            }, function(data) {
                Notification.error({
                    message: data
                });
            });
        }
    }]).filter('searchTaskFilter', function() {
        return function(tasks, filter) {
            var out = [];
            if (!angular.isUndefined(filter.text) && !_.isEmpty(filter.text) && filter.text.length > 2) {
                var searchableKeys = ['ownerName', 'name'];
                for (var i in tasks) {
                    for (var j in searchableKeys) {
                        var key = searchableKeys[j];
                        if (!angular.isUndefined(tasks[i][key])) {
                            var search = tasks[i][key].toLowerCase();
                            if (search.indexOf(filter.text.toLowerCase()) != -1) {
                                out.push(tasks[i])
                                break;
                            }
                            if (tasks[i].location) {
                                if (tasks[i].location.name.toLowerCase().indexOf(filter.text.toLowerCase()) != -1) {
                                    out.push(tasks[i])
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                out = tasks;
            }

            //filter for paid
            if (!angular.isUndefined(filter.paidOnly) && filter.paidOnly == true) {
                out = _.reject(out, function(el) {
                    return el.reward.money === false;
                });
            }
            // Filter logic here, adding matches to the out var.
            return out;
        }
    });

'use strict';

angular.module('snaptasqApp')
    .config(["$routeProvider", function($routeProvider) {
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
    }]);

'use strict';

angular.module('snaptasqApp')
    .factory('Auth', ["$location", "$rootScope", "$http", "User", "$cookieStore", "$q", function Auth($location, $rootScope, $http, User, $cookieStore, $q) {
        var currentUser = {};
        if ($cookieStore.get('token')) {
            currentUser = User.get();
        }

        return {

            /**
             * Authenticate user and save token
             *
             * @param  {Object}   user     - login info
             * @param  {Function} callback - optional
             * @return {Promise}
             */
            login: function(user, callback) {
                var cb = callback || angular.noop;
                var deferred = $q.defer();

                $http.post('/auth/local', {
                    email: user.email,
                    password: user.password
                }).
                success(function(data) {
                    $cookieStore.put('token', data.token);
                    currentUser = User.get();
                    deferred.resolve(data);
                    $rootScope._refreshMe(function(data) {
                        return cb(data.user);
                    });

                }).
                error(function(err) {
                    this.logout();
                    deferred.reject(err);
                    return cb(err);
                }.bind(this));

                return deferred.promise;
            },

            /**
             * Delete access token and user info
             *
             * @param  {Function}
             */
            logout: function() {
                $cookieStore.remove('token');
                currentUser = {};
            },

            /**
             * Create a new user
             *
             * @param  {Object}   user     - user info
             * @param  {Function} callback - optional
             * @return {Promise}
             */
            createUser: function(captcha, user, callback, _callbackFail) {
                var cb = callback || angular.noop;
                var bad = _callbackFail || angular.noop;

                return User.create({
                        captcha: captcha
                    }, user,
                    function(data) {
                        $cookieStore.put('token', data.token);
                        currentUser = User.get();
                        return cb(data.user);
                    },
                    function(err) {
                        this.logout();
                        return bad(err);
                    }.bind(this)).$promise;
            },

            /**
             * Change password
             *
             * @param  {String}   oldPassword
             * @param  {String}   newPassword
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            changePassword: function(oldPassword, newPassword, callback) {
                var cb = callback || angular.noop;

                return User.changePassword({
                    id: currentUser._id
                }, {
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }, function(user) {
                    return cb(user);
                }, function(err) {
                    return cb(err);
                }).$promise;
            },

            /**
             * Reset password if you are given correct code
             *
             * @param  {String}   newPassword
             * @param  {String}   resetCode1
             * @param  {String}   resetCode2
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            resetChangePassword: function(newPassword, resetCode1, resetCode2, _callback, _callbackFail) {
                var cb = _callback || angular.noop;
                var bad = _callbackFail || angular.noop;

                return User.resetChangePassword({}, {
                    newPassword: newPassword,
                    resetCode1: resetCode1,
                    resetCode2: resetCode2
                }, function(user) {
                    return cb(user);
                }, function(err) {
                    return bad(err);
                }).$promise;
            },

            /**
             * Send verification Email
             *
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            sendVerificationEmail: function(captcha, _callback, _callbackFail) {
                var cb = _callback || angular.noop;
                var bad = _callbackFail || angular.noop;
                currentUser.$promise.then(function(user) {
                    return User.sendVerificationEmail({
                            id: user._id,
                            captcha: captcha
                        }, {},
                        function(responseCode) {
                            return cb(responseCode);
                        },
                        function(err) {
                            return bad(err);
                        }).$promise;
                });
            },

            /**
             * Send forgot password Email
             *
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            sendForgotPasswordEmail: function(captcha, emailAddress, _callback, _callbackFail) {
                var cb = _callback || angular.noop;
                var bad = _callbackFail || angular.noop;
                //id:emailAddress
                return User.sendForgotPasswordEmail({
                        email: emailAddress,
                        captcha: captcha
                    }, {},
                    function(responseCode) {
                        return cb(responseCode);
                    },
                    function(err) {
                        return bad(err);
                    }).$promise;
            },

            /**
             * Deletes your own account, triggered by the settings
             **/
            deleteMyAccount: function(_callback, _callbackFail) {
                var cb = _callback || angular.noop;
                var bad = _callbackFail || angular.noop;
                currentUser.$promise.then(function(user) {
                    return User.deleteMyAccount({
                            id: user._id
                        }, {},
                        function(responseCode) {
                            return cb(responseCode);
                        },
                        function(err) {
                            return bad(err);
                        }).$promise;
                });
            },

            /**
             * Gets all available info on authenticated user
             *
             * @return {Object} user
             */
            getCurrentUser: function() {
                return currentUser;
            },

            /**
             * Check if a user is logged in
             *
             * @return {Boolean}
             */
            isLoggedIn: function() {
                return currentUser.hasOwnProperty('role');
            },

            /**
             * Check if a user has unlocked the beta trial
             *
             * @return {Boolean}
             */
            isBetaUnlocked: function() {
                if (angular.isUndefined(currentUser) || _.isEmpty(currentUser)) {
                    return false;
                }
                if (!currentUser.hasOwnProperty('requiresBeta')) return true;
                return !currentUser.requiresBeta
            },

            /**
             * Waits for currentUser to resolve before checking if user is logged in
             */
            isLoggedInAsync: function(cb) {
                if (currentUser.hasOwnProperty('$promise')) {
                    currentUser.$promise.then(function() {
                        cb(true);
                    }).catch(function() {
                        cb(false);
                    });
                } else if (currentUser.hasOwnProperty('role')) {
                    cb(true);
                } else {
                    cb(false);
                }
            },
            /**
             * Waits for currentUser to resolve before checking if user has verified their email and fb
             */
            isEmailAndFbVerifiedAsync: function(cb) {
                if (currentUser.hasOwnProperty('$promise')) {
                    currentUser.$promise.then(function() {
                        cb(currentUser.verification.status && currentUser.isConnectedWithFb);
                    }).catch(function() {
                        cb(false);
                    });
                } else {
                    cb(currentUser.verification.status && currentUser.isConnectedWithFb);
                }
            },

            /**
             * Check if a user is an admin
             *
             * @return {Boolean}
             */
            isAdmin: function() {
                return currentUser.role === 'admin';
            },

            /**
             * Get auth token
             */
            getToken: function() {
                return $cookieStore.get('token');
            }
        };
    }]);

'use strict';

angular.module('snaptasqApp')
    .factory('User', ["$resource", "$http", function($resource, $http) {
        var Usr = $resource('/api/users/:id/:controller', {
            id: '@_id'
        }, {
            applyBetaCode: {
                method: 'POST',
                params: {
                    controller: 'applyBetaCode'
                }
            },
            changePassword: {
                method: 'PUT',
                params: {
                    controller: 'password'
                }
            },
            resetChangePassword: {
                method: 'PUT',
                params: {
                    controller: 'resetChangePassword'
                }
            },
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            sendVerificationEmail: {
                method: 'POST',
                params: {
                    controller: 'sendVerificationEmail'
                }
            },
            sendForgotPasswordEmail: {
                method: 'POST',
                params: {
                    controller: 'sendForgotPasswordEmail'
                }
            },
            deleteMyAccount: {
                method: 'DELETE',
                params: {
                    controller: 'deleteMyAccount'
                }
            },
            get: {
                method: 'GET',
                params: {
                    id: 'me'
                }
            }
        });
        return Usr;
    }]);

'use strict';

angular.module('snaptasqApp').factory('Beta', ["$resource", "$http", function Beta($resource, $http) {
    var Bta = $resource('/api/beta/:id/:controller', {
        id: '@_id'
    }, {
        generateCode: {
            method: 'POST',
            params: {
                controller: ""
            }
        },
        addEmailBetaList: {
            method: "POST",
            params: {
                controller: "addEmailBetaList"
            }
        },
        removeEmailBetaList: {
            method: "POST",
            params: {
                controller: "removeEmailBetaList"
            }
        },
        userHasValidCode: {
            method: "GET",
            params: {
                controller: "userHasValidCode"
            }
        },
        isValidCode: {
            method: "POST",
            params: {
                controller: "isValidCode"
            }
        },
        activate: {
            method: 'POST',
            params: {
                controller: "activate"
            }
        },
        deactivate: {
            method: 'POST',
            params: {
                controller: "deactivate"
            }
        },
        getById: {
            method: 'GET',
            params: {
                controller: ""
            }
        },
        get: {
            method: 'GET',
            isArray: true,
            params: {
                controller: ""
            }
        }
    });
    return Bta;
}]);

var commentBox = angular.module('commentBox', []);

commentBox.directive('commentBox', function() {
    return {
        restrict: 'A',
        // Replace the div with our template
        replace: false,
        templateUrl: 'components/commentBox/commentBox.directive.template.html',
        scope: {
            commentBox: '=',
            onClose: '='
        },
        // Specify a controller directly in our directive definition.
        //TODO add a commentFactory
        controller: ["$scope", function($scope) {
            $scope.close = function() {
                $scope.onClose($scope.commentBox);
                //also need to broadcast a change to the parent

            }
            $scope.comments = [];
            /*if ($scope.githubUser) {
              return githubFactory.userRepos($scope.githubUser).success(function(rsp) {
                return $scope.repos = rsp.data;
              });
            } else {
              return githubFactory.repos().success(function(rsp) {
                return $scope.repos = rsp.data;
              });
            }*/
        }]
    };
});

/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('Community', ["$resource", "$http", "$q", function Community($resource, $http, $q) {

        var Comm = $resource('/api/communities/:id/:controller', {
            id: '@_id'
        }, {
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            update: {
                method: 'PUT',
                params: {
                    controller: ''
                }
            },
            getById: {
                method: 'GET',
                params: {
                    controller: ""
                }
            },
            getMyAppliedTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meApplied"
                }
            },
            getMyTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "me"
                }
            },
            get: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: ""
                }
            },
            getTasksResponsible: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meResponsible"
                }
            },
            setTasker: {
                method: 'POST',
                params: {
                    controller: "setTasker"
                }
            },
            confirmTasker: {
                method: 'POST',
                params: {
                    controller: "confirmTasker"
                }
            },
            applyToTask: {
                method: 'POST',
                params: {
                    controller: "apply"
                }
            },
            unapplyToTask: {
                method: 'POST',
                params: {
                    controller: "unapply"
                }
            }
        });
        return {
            delete: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.delete({
                    id: id
                }, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            create: function(data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.create({}, data, function(data) {
                    deferred.resolve(data);
                    if (cb)
                        return cb(data);
                });
                return deferred.promise;
            },
            getById: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getById({
                    id: id
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyAppliedTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getMyAppliedTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getMyTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            get: function(filter, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.get(filter, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            setTasker: function(id, applicantId, success, failure) {
                var success = success || angular.noop;
                var failure = failure || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "POST",
                    url: '/api/tasks/' + id + '/setTasker',
                    data: {
                        applicantId: applicantId
                    }
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return success(response.data);
                }, function(fail) {
                    deferred.reject(fail.data);
                    return failure(fail.data);
                });
                return deferred.promise;
            },
            /**
             * This will return all tasks where the user is the chosen tasker
             **/
            getTasksResponsible: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.getTasksResponsible({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            countResponsibleTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "GET",
                    url: '/api/tasks/countResponsible'
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return cb(response.data);
                });
                return deferred.promise;
            },
            /** This can confirm to be a yes or no 
             * In the case where a tasker decides to not help
             * It will set the applicant to no one and confirm: false,
             * it will also email the task owner
             * @param id: The id of the task
             * @param isAccepted: false, if they dont want to help, true if they want to help
             * @param cb: a callback function
             **/
            confirmTasker: function(id, isAccepted, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.confirmTasker({
                    id: id,
                    isAccepted: isAccepted
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            applyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.applyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            unapplyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Comm.unapplyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            }
        };
    }]);

'use strict';

angular.module('snaptasqApp')
    .factory('Modal', ["$rootScope", "$modal", function($rootScope, $modal) {
        /**
         * Opens a modal
         * @param  {Object} scope      - an object to be merged with modal's scope
         * @param  {String} modalClass - (optional) class(es) to be applied to the modal
         * @return {Object}            - the instance $modal.open() returns
         */
        function openModal(scope, modalClass) {
            var modalScope = $rootScope.$new();
            scope = scope || {};
            scope.success = function() {
                modal.close();
            }
            modalClass = modalClass || 'modal-default';

            angular.extend(modalScope, scope);

            var modal = $modal.open({
                templateUrl: 'components/modal/modal.html',
                windowClass: modalClass,
                scope: modalScope
            });

            return modal;
        }

        // Public API here
        return {

            /* Confirmation modals */
            confirm: {

                /**
                 * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} del - callback, ran when delete is confirmed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                delete: function(del) {
                    del = del || angular.noop;

                    /**
                     * Open a delete confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to del callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            name = args.shift(),
                            deleteModal;

                        deleteModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Confirm Delete',
                                html: '<p>Are you sure you want to delete <strong>' + name + '</strong> ?</p>',
                                buttons: [{
                                    classes: 'btn-danger',
                                    text: 'Delete',
                                    click: function(e) {
                                        deleteModal.close(e);
                                    }
                                }, {
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        deleteModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-danger');

                        deleteModal.result.then(function(event) {
                            del.apply(event, args);
                        });
                    };
                }
            },
            /* Signup modals */
            create: {

                /**
                 * Create a function to open a registration modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} reg - callback, ran when the registration is completed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                register: function(reg) {
                    reg = reg || angular.noop;


                    /*$rootScope.beepBoop = function(){
                      console.log("HELLO THERE");
                    }*/

                    /**
                     * Open a delete confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to reg callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            name = args.shift(),
                            registerModal;

                        registerModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Create an Account',
                                captcha: true,
                                htmlInclude: 'app/account/signup/signup.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        registerModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        registerModal.result.then(function(event) {
                            reg.apply(event, args);
                        });
                    };
                }
            },
            view: {
                /**
                 * Create a function to open a registration modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when the registration is completed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                applicants: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a delete confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to cb callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            task = args.shift(),
                            registerModal;

                        registerModal = openModal({
                            modal: {
                                task: task,
                                dismissable: true,
                                title: 'Applicants',
                                htmlInclude: 'app/task/components/applicants.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'ok',
                                    click: function(e) {
                                        registerModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        registerModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
                /**
                 * Create a function to view pricePoints (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when the registration is completed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                pricePoints: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a delete confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to cb callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            task = args.shift(),
                            myModal;

                        myModal = openModal({
                            modal: {
                                task: task,
                                dismissable: true,
                                title: 'Price Points',
                                htmlInclude: 'app/pricePoints/pricePoints.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'ok',
                                    click: function(e) {
                                        myModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        myModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
            }
        };
    }]);

'use strict';

/**
 * Removes server error when user updates input
 */
angular.module('snaptasqApp')
    .directive('mongooseError', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                element.on('keydown', function() {
                    return ngModel.$setValidity('mongoose', true);
                });
            }
        };
    });

'use strict';

angular.module('snaptasqApp')
    .controller('NavbarCtrl', ["$scope", "$location", "Auth", "Notify", "$interval", "$timeout", function($scope, $location, Auth, Notify, $interval, $timeout) {
        $scope.responsibleCount = 0;
        $scope.menuTask = [{
            'title': 'My Tasqs',
            'link': '/tasks/mine',
            reqLogin: true,
            reqBeta: true
        }, {
            'title': 'Applied Tasqs',
            'link': '/tasks/applied',
            reqLogin: true,
            reqBeta: true
        }, {
            'title': 'Chosen Tasqs',
            'link': '/tasks/chosen',
            count: function() {
                return $scope.responsibleCount;
            },
            reqLogin: true,
            reqBeta: true
        }, ];
        $scope.menuAdmin = [];
        $scope.menu = [];

        $scope.reloadMenu = function() {
            Auth.isLoggedInAsync(function(isLoggedIn) {
                if (isLoggedIn) {
                    $scope.menu = [];
                    if (Auth.isBetaUnlocked()) {
                        $scope.menu.push({
                            'title': 'Communities',
                            'link': '/communities',
                            reqLogin: true
                        });
                    } else {
                        $scope.menu.push({
                            'title': 'Request Beta',
                            'link': '/requestBeta',
                            reqLogin: true
                        });
                        $scope.menu.push({
                            'title': 'Enter Beta Code',
                            'link': '/beta',
                            reqLogin: true
                        });
                    }
                    if (Auth.isAdmin()) {
                        $scope.menuAdmin = [];
                        $scope.menuAdmin.push({
                            'title': 'Beta',
                            'link': '/admin/beta',
                            reqLogin: true
                        });
                        $scope.menuAdmin.push({
                            'title': 'Community',
                            'link': '/admin/community',
                            reqLogin: true
                        });
                        $scope.menuAdmin.push({
                            'title': 'Users',
                            'link': '/admin/users',
                            reqLogin: true
                        });
                    }
                    $scope.menu.push({
                        'title': 'Rewards',
                        'link': '/rewards',
                        reqLogin: true,
                        reqBeta: false
                    });
                } else {
                    $scope.menu = [{
                        'title': 'Request Beta',
                        'link': '/requestBeta',
                        reqBeta: true
                    }];
                }
            });
        };

        $scope.reloadMenu();
        $scope.goToSignup = function() {
            $location.path("/signin?action=register");
        };
        $scope.goToNotifications = function() {
            $location.path("/notifications");
        };

        /* Notifications from the server from this week */
        $scope.notifications = [];
        /*
        $interval(function() {
            Notify.get(function(notifications) {
                $scope.notifications = notifications;
            });
        }, 5000);
        */
        Notify.get(function(notifications) {
            $scope.notifications = notifications;
        });

        $scope.isNotCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
        $scope.isAdmin = Auth.isAdmin;
        $scope.currentUser = Auth.getCurrentUser();

        // happens when user logs in with email
        $scope.$on('user.state_change', function(event) {
            $scope.reloadMenu();
        });
        $scope.$watch(function() {
            return Auth.isBetaUnlocked()
        }, function(newVal, oldVal) {
            $scope.isUserBetaLocked = !Auth.isBetaUnlocked();
            //$scope.reloadMenu();
        });

        $scope.$watch(function() {
            return Auth.getCurrentUser()
        }, function(newVal, oldVal) {
            if (typeof newVal !== 'undefined') {
                $scope.currentUser = newVal;
                $scope.reloadMenu();
            }
        });

        $scope.logout = function() {
            Auth.logout();
            $scope.reloadMenu();
            $location.path('/signin');
        };

        $scope.isActive = function(route) {
            return route === $location.path();
        };

        $scope.$on('count.responsible', function(event, count) {
            $scope.responsibleCount = count;
        });
    }]);

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
        controller: ["$scope", "$element", "$attrs", "$timeout", "$location", "$interval", function($scope, $element, $attrs, $timeout, $location, $interval) {
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
        }],
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

'use strict';

angular.module('snaptasqApp')
    .factory('Notify', ["$http", "$q", function Notify($http, $q) {
        return {

            /**
             * Authenticate user and save token
             *
             * @param  {Object}   user     - login info
             * @param  {Function} callback - optional
             * @return {Promise}
             */
            get: function(callback) {
                var cb = callback || angular.noop;
                var deferred = $q.defer();

                $http.get('/api/notify').
                success(function(data) {
                    deferred.resolve(data);
                    return cb(data);
                }).
                error(function(err) {
                    deferred.reject(err);
                    return cb(err);
                }.bind(this));

                return deferred.promise;
            }
        };
    }]);

/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('socket', ["socketFactory", function(socketFactory) {

        // socket.io now auto-configures its connection when we ommit a connection url
        var ioSocket = io('', {
            // Send auth token on connection, you will need to DI the Auth service above
            // 'query': 'token=' + Auth.getToken()
            path: '/socket.io-client'
        });

        var socket = socketFactory({
            ioSocket: ioSocket
        });

        return {
            socket: socket,

            /**
             * Register listeners to sync an array with updates on a model
             *
             * Takes the array we want to sync, the model name that socket updates are sent from,
             * and an optional callback function after new items are updated.
             *
             * @param {String} modelName
             * @param {Array} array
             * @param {Function} cb
             */
            syncUpdates: function(modelName, array, cb) {
                cb = cb || angular.noop;

                /**
                 * Syncs item creation/updates on 'model:save'
                 */
                socket.on(modelName + ':save', function(item) {
                    var oldItem = _.find(array, {
                        _id: item._id
                    });
                    var index = array.indexOf(oldItem);
                    var event = 'created';

                    // replace oldItem if it exists
                    // otherwise just add item to the collection
                    if (oldItem) {
                        array.splice(index, 1, item);
                        event = 'updated';
                    } else {
                        array.push(item);
                    }

                    cb(event, item, array);
                });

                /**
                 * Syncs removed items on 'model:remove'
                 */
                socket.on(modelName + ':remove', function(item) {
                    var event = 'deleted';
                    _.remove(array, {
                        _id: item._id
                    });
                    cb(event, item, array);
                });
            },

            /**
             * Removes listeners for a models updates on the socket
             *
             * @param modelName
             */
            unsyncUpdates: function(modelName) {
                socket.removeAllListeners(modelName + ':save');
                socket.removeAllListeners(modelName + ':remove');
            }
        };
    }]);

/* global io */
'use strict';

angular.module('snaptasqApp')
    .factory('Task', ["$resource", "$http", "$q", function Task($resource, $http, $q) {

        var Tsk = $resource('/api/tasks/:id/:controller', {
            id: '@_id'
        }, {
            create: {
                method: 'POST',
                params: {
                    controller: ""
                }
            },
            update: {
                method: 'PUT',
                params: {
                    controller: ''
                }
            },
            getById: {
                method: 'GET',
                params: {
                    controller: ""
                }
            },
            getMyAppliedTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meApplied"
                }
            },
            getMyTasks: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "me"
                }
            },
            get: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: ""
                }
            },
            getTasksResponsible: {
                method: 'GET',
                isArray: true,
                params: {
                    controller: "meResponsible"
                }
            },
            setTasker: {
                method: 'POST',
                params: {
                    controller: "setTasker"
                }
            },
            confirmTasker: {
                method: 'POST',
                params: {
                    controller: "confirmTasker"
                }
            },
            applyToTask: {
                method: 'POST',
                params: {
                    controller: "apply"
                }
            },
            unapplyToTask: {
                method: 'POST',
                params: {
                    controller: "unapply"
                }
            }
        });
        return {
            delete: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.delete({
                    id: id
                }, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            create: function(data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.create({}, data, function(data) {
                    deferred.resolve(data);
                    if (cb)
                        return cb(data);
                });
                return deferred.promise;
            },
            getById: function(id, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getById({
                    id: id
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyAppliedTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getMyAppliedTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            getMyTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getMyTasks({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            get: function(filter, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.get(filter, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            setTasker: function(id, applicantId, success, failure) {
                var success = success || angular.noop;
                var failure = failure || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "POST",
                    url: '/api/tasks/' + id + '/setTasker',
                    data: {
                        applicantId: applicantId
                    }
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return success(response.data);
                }, function(fail) {
                    deferred.reject(fail.data);
                    return failure(fail.data);
                });
                return deferred.promise;
            },
            /**
             * This will return all tasks where the user is the chosen tasker
             **/
            getTasksResponsible: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.getTasksResponsible({}, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            countResponsibleTasks: function(cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                $http({
                    method: "GET",
                    url: '/api/tasks/countResponsible'
                }).then(function(response) {
                    deferred.resolve(response.data);
                    return cb(response.data);
                });
                return deferred.promise;
            },
            /** This can confirm to be a yes or no 
             * In the case where a tasker decides to not help
             * It will set the applicant to no one and confirm: false,
             * it will also email the task owner
             * @param id: The id of the task
             * @param isAccepted: false, if they dont want to help, true if they want to help
             * @param cb: a callback function
             **/
            confirmTasker: function(id, isAccepted, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.confirmTasker({
                    id: id,
                    isAccepted: isAccepted
                }, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            applyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.applyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            },
            unapplyToTask: function(id, data, cb) {
                var cb = cb || angular.noop;
                var deferred = $q.defer();
                Tsk.unapplyToTask(id, data, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                return deferred.promise;
            }
        };
    }])
    .factory('TaskMarshaler', ["localStorageService", function(localStorageService) {
        /**
         * This factory is used to send data between angularjs controllers
         * Where the data is a task. If theres no incoming data, this may be empty
         * This is a singleton
         **/
        var defaultTask = {
            name: undefined,
            location: {
                geo: {}
            },
            payout: 10.0
        };

        var setTask = function(t) {
            //this is only called when the task cant be posted yet
            localStorageService.set("savedTask", t);
        }

        /**
         * This is used in the main searchbox, it gives a prefilled task
         * That can be overrided
         **/
        var createDefaultTask = function(overRideTask) {
            var base = {
                name: undefined,
                location: {
                    geo: {}
                },
                payout: 10.0
            };
            return angular.extend(base, overRideTask);
        }

        var removeTask = function() {
            localStorageService.remove("savedTask");
            //localStorageService.clearAll();
        }
        var getTask = function() {
            return localStorageService.get("savedTask") || angular.copy(defaultTask);
        }
        var hasTask = function() {
            var task = getTask();
            if (angular.isUndefined(task) || angular.isUndefined(task.name))
                return false;
            return true;
        };

        var isLocationFormatted = function(location) {
            // if the task location has the property details,
            // that means it was changed, so the taskmarshaler
            // should reprocess the task location object!
            // even if theres already data stored.
            if (!angular.isUndefined(location.details)) {
                return false;
            }
            var hasFields = 1;
            hasFields &= !angular.isUndefined(location.name);
            hasFields &= !angular.isUndefined(location.formattedName);
            hasFields &= !angular.isUndefined(location.sname);
            hasFields &= !angular.isUndefined(location.geo);
            if (hasFields == 0) //to prevent a bug from accessing a field in an undefined
                return hasFields;
            hasFields &= !angular.isUndefined(location.geo.center);
            if (hasFields == 0) //to prevent a bug from accessing a field in an undefined
                return hasFields;
            hasFields &= !angular.isUndefined(location.geo.center.latitude);
            hasFields &= !angular.isUndefined(location.geo.center.longitude);
            hasFields &= !angular.isUndefined(location.geo.hash);
            hasFields &= !angular.isUndefined(location.place_id);
            hasFields &= !angular.isUndefined(location.url);
            hasFields &= !angular.isUndefined(location.vicinity);
            return hasFields;
        }


        /** This takes input of the { location.name location.details {} }
         * and will output the correct format for the schema
         **/
        var formatLocation = function(location) {
            if (isLocationFormatted(location))
                return location;
            var d = location.details || location;
            var latitude, longitude;
            try {
                latitude = location.details.geometry.location.lat();
                longitude = location.details.geometry.location.lng();
            } catch (err) {
                latitude = location.geo.center.latitude;
                longitude = location.geo.center.longitude;
            }
            var n = location.name;

            var address = d.formatted_address || d.formattedName;
            var vicin = d.vicinity || d.sname;
            var parsedLocation = {
                name: n,
                formattedName: address,
                geo: {
                    center: {
                        latitude: latitude,
                        longitude: longitude
                    },
                    hash: ngeohash.encode(latitude, longitude),
                },
                sname: d.name,
                place_id: d.place_id,
                url: d.url,
                vicinity: vicin
            };

            return parsedLocation;

        };
        //TODO: handle creating of tasks
        return {
            setTask: setTask,
            removeTask: removeTask,
            getTask: getTask,
            hasTask: hasTask,
            formatLocation: formatLocation,
            createDefaultTask: createDefaultTask,
        };
    }])
    .factory('TaskMock', function() {
        function genName() {
            return chance.name();
        }

        function genId() {
            return Math.random().toString(36).substr(2, 5);
        }

        function genDate() {
            return chance.date({
                year: 2015,
                month: 4
            });
        }

        function generate() {

        }

        var generate = function() {
            if (Math.random() > 0.7) {
                return {
                    name: genName(),
                    number: genId(),
                    date: genDate(),
                    class: 'orange',
                    selected: false,
                    description: chance.paragraph()
                }
            } else {
                return {
                    name: genName(),
                    number: genId(),
                    date: genDate(),
                    class: 'blue',
                    selected: false,
                    description: chance.paragraph()
                }
            }
        }

        return {
            generate: generate
        };
    });

angular.module('snaptasqApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('app/ToS/privacy/privacy.html',
    "<div class=\"container top-buffer\"><h3>Privacy Policy</h3><p>Your privacy is very important to us. Accordingly, we have developed this Policy in order for you to understand how we collect, use, communicate and disclose and make use of personal information. The following outlines our privacy policy.</p><ul><li>Before or at the time of collecting personal information, we will identify the purposes for which information is being collected.</li><li>We will collect and use of personal information solely with the objective of fulfilling those purposes specified by us and for other compatible purposes, unless we obtain the consent of the individual concerned or as required by law.</li><li>We will only retain personal information as long as necessary for the fulfillment of those purposes.</li><li>We will collect personal information by lawful and fair means and, where appropriate, with the knowledge or consent of the individual concerned.</li><li>Personal data should be relevant to the purposes for which it is to be used, and, to the extent necessary for those purposes, should be accurate, complete, and up-to-date.</li><li>We will protect personal information by reasonable security safeguards against loss or theft, as well as unauthorized access, disclosure, copying, use or modification.</li><li>We will make readily available to customers information about our policies and practices relating to the management of personal information.</li></ul><p>We are committed to conducting our business in accordance with these principles in order to ensure that the confidentiality of personal information is protected and maintained.</p></div><!-- /.container -->"
  );


  $templateCache.put('app/ToS/terms/terms.html',
    "<div class=\"container top-buffer\" ng-controller=TermsCtrl><h1>snaptasq Web Site Agreement</h1><h3>Short and Sweet</h3><div>If you don't wanna read the long tail version below, take a peek at the DOs and DONTs</div><strong>DO</strong><ul><li>Use our service for free</li><li>Post as much information about your task as is needed.</li><li>Help out your friends to return favors</li><li>Be nice to people</li><li>Pay your friends as promised when they help you out. Note we do not enforce nor will snaptasq investigate any disputes. You can take these to small claims courts.</li></ul><strong>DO NOT</strong><ul><li>Use snaptasq during/for any type of emergency</li><li>Leave completed tasks on this site</li><li>Bail on your friends</li><li>Misuse our service to post illegal, criminal, or dangerous activities. We will report these once they are flagged to authorities</li></ul><h1>snaptasq Additional Terms</h1><p>The www.snaptasq.com Web Site (the \"Site\") is an online information service provided by snaptasq (\"www.snaptasq.com\"), subject to your compliance with the terms and conditions set forth below. PLEASE READ THIS DOCUMENT CAREFULLY BEFORE ACCESSING OR USING THE SITE. BY ACCESSING OR USING THE SITE, YOU AGREE TO BE BOUND BY THE TERMS AND CONDITIONS SET FORTH BELOW. IF YOU DO NOT WISH TO BE BOUND BY THESE TERMS AND CONDITIONS, YOU MAY NOT ACCESS OR USE THE SITE. www.snaptasq.com MAY MODIFY THIS AGREEMENT AT ANY TIME, AND SUCH MODIFICATIONS SHALL BE EFFECTIVE IMMEDIATELY UPON POSTING OF THE MODIFIED AGREEMENT ON THE SITE. YOU AGREE TO REVIEW THE AGREEMENT PERIODICALLY TO BE AWARE OF SUCH MODIFICATIONS AND YOUR CONTINUED ACCESS OR USE OF THE SITE SHALL BE DEEMED YOUR CONCLUSIVE ACCEPTANCE OF THE MODIFIED AGREEMENT. 1. Copyright, Licenses and Idea Submissions. The entire contents of the Site are protected by international copyright and trademark laws. The owner of the copyrights and trademarks are www.snaptasq.com, its affiliates or other third party licensors. YOU MAY NOT MODIFY, COPY, REPRODUCE, REPUBLISH, UPLOAD, POST, TRANSMIT, OR DISTRIBUTE, IN ANY MANNER, THE MATERIAL ON THE SITE, INCLUDING TEXT, GRAPHICS, CODE AND/OR SOFTWARE. You may print and download portions of material from the different areas of the Site solely for your own non-commercial use provided that you agree not to change or delete any copyright or proprietary notices from the materials. You agree to grant to www.snaptasq.com a non-exclusive, royalty-free, worldwide, perpetual license, with the right to sub-license, to reproduce, distribute, transmit, create derivative works of, publicly display and publicly perform any materials and other information (including, without limitation, ideas contained therein for new or improved products and services) you submit to any public areas of the Site (such as bulletin boards, forums, newsgroups, task walls) or by e-mail to www.snaptasq.com by all means and in any media now known or hereafter developed. You also grant to www.snaptasq.com the right to use your name in connection with the submitted materials and other information as well as in connection with all advertising, marketing and promotional material related thereto. You agree that you shall have no recourse against www.snaptasq.com for any alleged or actual infringement or misappropriation of any proprietary right in your communications to www.snaptasq.com. TrafficServer 1.01 TRADEMARKS.</p><p>Publications, products, content or services referenced herein or on the Site are the exclusive trademarks or servicemarks of www.snaptasq.com. Other product and company names mentioned in the Site may be the trademarks of their respective owners. Notice: DISCLAIMER. MANY JURISDICTIONS HAVE LAWS PROTECTING CONSUMERS AND OTHER CONTRACT PARTIES, LIMITING THEIR ABILITY TO WAIVE CERTAIN RIGHTS AND RESPONSIBILITIES. WE RESPECT SUCH LAWS; NOTHING HEREIN SHALL WAIVE RIGHTS OR RESPONSIBILITIES THAT CANNOT BE WAIVED. To the extent permitted by law, (1) we make no promise as to the Site, its completeness, accuracy, availability, timeliness, propriety, security or reliability; (2) your access and use are at your own risk, and the Site is provided \"AS IS\" and \"AS AVAILABLE\"; (3) we are not liable for any harm resulting from (a) user content; (b) user conduct, e.g. illegal conduct; (c) your the Site use; or (d) our representations; (4) WE AND OUR OFFICERS, DIRECTORS, EMPLOYEES (\"the Site ENTITIES\"), DISCLAIM ALL WARRANTIES &amp; CONDITIONS, EXPRESS OR IMPLIED, OF MERCHANTABILITY, FITNESS FOR PARTICULAR PURPOSE, OR NON-INFRINGEMENT; (5) the Site ENTITIES ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS (E.G. OF PROFIT, REVENUE, DATA, OR GOODWILL); 2. Use of the Site. DISCLAIMER. MANY JURISDICTIONS HAVE LAWS PROTECTING CONSUMERS AND OTHER CONTRACT PARTIES, LIMITING THEIR ABILITY TO WAIVE CERTAIN RIGHTS AND RESPONSIBILITIES. WE RESPECT SUCH LAWS; NOTHING HEREIN SHALL WAIVE RIGHTS OR RESPONSIBILITIES THAT CANNOT BE WAIVED. To the extent permitted by law, (1) we make no promise as to the Site, its completeness, accuracy, availability, timeliness, propriety, security or reliability; (2) your access and use are at your own risk, and the Site is provided \"AS IS\" and \"AS AVAILABLE\"; (3) we are not liable for any harm resulting from (a) user content; (b) user conduct, e.g. illegal conduct; (c) your the Site use; or (d) our representations; (4) WE AND OUR OFFICERS, DIRECTORS, EMPLOYEES (\"the Site ENTITIES\"), DISCLAIM ALL WARRANTIES &amp; CONDITIONS, EXPRESS OR IMPLIED, OF MERCHANTABILITY, FITNESS FOR PARTICULAR PURPOSE, OR NON-INFRINGEMENT; (5) the Site ENTITIES ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS (E.G. OF PROFIT, REVENUE, DATA, OR GOODWILL); (6) IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED WHAT YOU PAID US IN THE PAST YEAR. You understand that, except for information, products or services clearly identified as being supplied by www.snaptasq.com, www.snaptasq.com does not operate, control or endorse any information, products or services on the Internet in any way. Except for www.snaptasq.com- identified information, products or services, all information, products and services offered through the Site or on the Internet generally are offered by third parties, that are not affiliated with www.snaptasq.com a. You also understand that www.snaptasq.com cannot and does not guarantee or warrant that files available for downloading through the Site will be free of infection or viruses, worms, Trojan horses or other code that manifest contaminating or destructive properties. You are responsible for implementing sufficient procedures and checkpoints to satisfy your particular requirements for accuracy of data input and output, and for maintaining a means external to the Site for the reconstruction of any lost data. YOU ASSUME TOTAL RESPONSIBILITY AND RISK FOR YOUR USE OF THE SITE AND THE INTERNET. www.snaptasq.com PROVIDES THE SITE AND RELATED INFORMATION \"AS IS\" AND DOES NOT MAKE ANY EXPRESS OR IMPLIED WARRANTIES, REPRESENTATIONS OR ENDORSEMENTS WHATSOEVER (INCLUDING WITHOUT LIMITATION WARRANTIES OF TITLE OR NONINFRINGEMENT, OR THE IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE) WITH REGARD TO THE SERVICE, ANY MERCHANDISE INFORMATION OR SERVICE PROVIDED THROUGH THE SERVICE OR ON THE INTERNET GENERALLY, AND www.snaptasq.com SHALL NOT BE LIABLE FOR ANY COST OR DAMAGE ARISING EITHER DIRECTLY OR INDIRECTLY FROM ANY SUCH TRANSACTION. IT IS SOLELY YOUR RESPONSIBILITY TO EVALUATE THE ACCURACY, COMPLETENESS AND USEFULNESS OF ALL OPINIONS, ADVICE, SERVICES, MERCHANDISE AND OTHER INFORMATION PROVIDED THROUGH THE SERVICE OR ON THE INTERNET GENERALLY. www.snaptasq.com DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE OR THAT DEFECTS IN THE SERVICE WILL BE CORRECTED.</p><p>YOU UNDERSTAND FURTHER THAT THE PURE NATURE OF THE INTERNET CONTAINS UNEDITED MATERIALS SOME OF WHICH ARE SEXUALLY EXPLICIT OR MAY BE OFFENSIVE TO YOU. YOUR ACCESS TO SUCH MATERIALS IS AT YOUR RISK. www.snaptasq.com HAS NO CONTROL OVER AND ACCEPTS NO RESPONSIBILITY WHATSOEVER FOR SUCH MATERIALS.</p><p>LIMITATION OF LIABILITY</p><p>IN NO EVENT WILL www.snaptasq.com BE LIABLE FOR (I) ANY INCIDENTAL, CONSEQUENTIAL, OR INDIRECT DAMAGES (INCLUDING, BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, BUSINESS INTERRUPTION, LOSS OF PROGRAMS OR INFORMATION, AND THE LIKE) ARISING OUT OF THE USE OF OR INABILITY TO USE THE SERVICE, OR ANY INFORMATION, OR TRANSACTIONS PROVIDED ON THE SERVICE, OR DOWNLOADED FROM THE SERVICE, OR ANY DELAY OF SUCH INFORMATION OR SERVICE. EVEN IF www.snaptasq.com OR ITS AUTHORIZED REPRESENTATIVES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, OR (II) ANY CLAIM ATTRIBUTABLE TO ERRORS, OMISSIONS, OR OTHER INACCURACIES IN THE SERVICE AND/OR MATERIALS OR INFORMATION DOWNLOADED THROUGH THE SERVICE. BECAUSE SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, THE ABOVE LIMITATION MAY NOT APPLY TO YOU. IN SUCH STATES, www.snaptasq.com LIABILITY IS LIMITED TO THE GREATEST EXTENT PERMITTED BY LAW. www.snaptasq.com makes no representations whatsoever about any other web site which you may access through this one or which may link to this Site. When you access a non-www.snaptasq.com web site, please understand that it is independent from www.snaptasq.com, and that www.snaptasq.com has no control over the content on that web site. In addition, a link to a www.snaptasq.com web site does not mean that www.snaptasq.com endorses or accepts any responsibility for the content, or the use, of such web site.</p><p>3. Indemnification. You agree to indemnify, defend and hold harmless www.snaptasq.com, its officers, directors, employees, agents, licensors, suppliers and any third party information providers to the Service from and against all losses, expenses, damages and costs, including reasonable attorneys' fees, resulting from any violation of this Agreement (including negligent or wrongful conduct) by you or any other person accessing the Service. 4. Third Party Rights. The provisions of paragraphs 2 (Use of the Service), and 3 (Indemnification) are for the benefit of www.snaptasq.com and its officers, directors, employees, agents, licensors, suppliers, and any third party information providers to the Service. Each of these individuals or entities shall have the right to assert and enforce those provisions directly against you on its own behalf. 5.Term; Termination. This Agreement may be terminated by either party without notice at any time for any reason. The provisions of paragraphs 1 (Copyright, Licenses and Idea Submissions), 2 (Use of the Service), 3 (Indemnification), 4 (Third Party Rights) and 6 (Miscellaneous) shall survive any termination of this Agreement. 6.Miscellaneous. This Agreement shall all be governed and construed in accordance with the laws of USA applicable to agreements made and to be performed in USA. You agree that any legal action or proceeding between www.snaptasq.com and you for any purpose concerning this Agreement or the parties' obligations hereunder shall be brought exclusively in a federal or state court of competent jurisdiction sitting in USA . Any cause of action or claim you may have with respect to the Service must be commenced within one (1) year after the claim or cause of action arises or such claim or cause of action is barred. www.snaptasq.com's failure to insist upon or enforce strict performance of any provision of this Agreement shall not be construed as a waiver of any provision or right. Neither the course of conduct between the parties nor trade practice shall act to modify any provision of this Agreement. www.snaptasq.com may assign its rights and duties under this Agreement to any party at any time without notice to you. Any rights not expressly granted herein are reserved.</p></div><!-- /.container -->"
  );


  $templateCache.put('app/aboutus/aboutus.html',
    "<div class=\"container top-buffer\"><h1 class=text-center>What is SnapTasq</h1><div class=\"row top-buffer\">SnapTasq is an online software product that allows users to accomplish simple tasks with people they are closest to. Users request and monitor tasks to be done by a list of people they are already closest to. SnapTasq was founded when Robert Irribarren observing his friends at college needing small tasks completed when stuck studying. For the time being they were using a Facebook group to accomplish these task. To expand features beyond what the Facebook group was capable of providing, Robert decided to create an app focused on \"friends helping friends\".</div><h1 class=text-center>Our Team</h1><div class=\"row top-buffer\"><div class=\"col-md-3 text-center\"><div class=row><div class=col-md-12><img src=assets/team_pictures/robbie.png style=\"height:210px\"/><div><strong>Robbie Irribarren</strong></div><div>CEO + Founder</div></div></div></div><div class=col-md-9 style=font-size:1.2em;padding-top:50px>The visionary for redefining the \"Online Social Communities\" for revolutionizing how societies take on work has led Robert Irribarren to pioneer the concept of “Service Networking,” forging a leading role in the Collaborative Consumption movement. Since starting SnapTasq in 2015, Robbie has led SnapTasq to a thriving steady rate of growth.</div></div><div class=\"row top-buffer bot-buffer\"><div class=\"col-md-3 text-center\"><div class=row><div class=col-md-12><img src=assets/team_pictures/adam.png style=\"height:210px\"/><div><strong>Adam Brinning</strong></div><div>Chief Marketing Officer</div></div></div></div><div class=col-md-9 style=font-size:1.2em;padding-top:50px>A seasoned marketing executive with a passion for operational, analytical, and strategic development inspired Adam Brinning to join SnapTasq, where he applied his considerable experience of expanding the marketplace. Before managing the marketspace of SnapTasq, Adam has spearheaded wurlpool and high five.</div></div><div class=\"row top-buffer bot-buffer\"><div class=\"col-md-3 text-center\"><div class=row><div class=col-md-12><img src=assets/team_pictures/sylvia.png style=\"height:210px\"/><div><strong>Sylvia Leung</strong></div><div>Senior UI/UX Designer</div></div></div></div><div class=col-md-9 style=font-size:1.2em;padding-top:50px>Visual and interaction designer focused on designing UI/UX for SnapTasq. As a designer she strives to achieve a higher level of communication with others through visual interpretations and to reach a final product that is both unique and innovative in style.</div></div></div><!-- /.container -->"
  );


  $templateCache.put('app/account/beta/beta.html',
    "<div class=container id=betaCodeEntry><section class=\"col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\" style=margin-top:50px><div id=betabox class=mainbox><div class=\"panel panel-info\"><!-- <div class=\"panel-heading\">\n" +
    "            <div class=\"panel-title\">Sign In</div>\n" +
    "          </div>      --><div class=panel-body><!-- <div style=\"\" id=\"login-alert\" class=\"alert alert-danger col-sm-12\"></div> --><p>SnapTasq is in a closed Beta. If you have a beta code please enter it here. Otherwise you can find and ask for beta codes <a href=https://www.facebook.com/pages/SnapTasq/853438738068906 target=_tab>here</a>. You may also want to subscribe to our beta code mailing list <a href=/requestBeta>here</a></p><form id=betaform class=form-horizontal name=form role=form ng-submit=checkbeta(form) novalidate><div style=\"margin-bottom: 25px\" class=input-group><span class=input-group-addon><i class=\"fa fa-key\"></i></span> <input id=beta-code class=form-control name=betaCode placeholder=\"Beta Code\" ng-model=betaCode required></div><div class=\"form-group has-error\"><p class=help-block ng-show=\"form.betaCode.$error && submitted\">Invalid beta code</p><p class=help-block>{{ errors.other }}</p></div><div class=form-group><!-- Button --><div class=\"col-sm-12 col-md-12 controls\"><button class=\"btn btn-success\" style=width:100% type=submit>Continue</button></div></div></form></div></div></div></section></div>"
  );


  $templateCache.put('app/account/connect/connect.html',
    "<div class=container><div class=row ng-show=\"currentUser.verification.status==false\"><div class=col-sm-12><h1>Verify Your Email</h1><p>It is probably in your inbox already. If its not you can send another email with the button below.</p></div><div class=col-sm-12><form class=form name=formEmailVerification ng-submit=sendVerificationEmail(formEmailVerification)><input type=hidden ng-model=captchaResponse name=captchaResponse><br><div style=margin-bottom:10px vc-recaptcha key=\"'6LfjmgcTAAAAAFerg8_alh6LFcb4QQvrF8Gg4qz1'\" on-success=\"captchaResponse=response\"></div><button class=\"btn btn-primary\" type=submit><i class=\"fa fa-envelope-o\"></i>&nbsp;Resend Email Verification</button></form></div></div><div ng-if=\"currentUser.verification.status && !currentUser.isConnectedWithFb\" class=row><!--first time connect--><div ng-if=!currentUser.hasConnectedWithFbOnce class=col-sm-12><h1>Last Step <span><a class=\"btn btn-facebook\" href=\"\" ng-click=connect()><i class=\"fa fa-facebook\"></i> Connect with Facebook</a></span></h1><h3>Why is this needed?</h3><p>snaptasq is a friends only service. We will only show tasks posted by friends. This is done by connecting with your Facebook.</p><p><strong>We don't want to post anything on your Facebook wall. snaptasq has its own wall.</strong></p><p>For more information please view our privacy policy <a href=/privacy target=_tab>here</a></p></div><!-- reconnecting due to invalid access token --><div ng-if=currentUser.hasConnectedWithFbOnce class=col-sm-12><h1>Reconnect with Facebook<span><a class=\"btn btn-facebook\" href=\"\" ng-click=connect()><i class=\"fa fa-facebook\"></i> Connect with Facebook</a></span></h1><h3>What happened?</h3><p>snaptasq was unable to find your friends from Facebook. This can happen when you change Facebook settings. To fix this, click connect with facebook</p><p><strong>We don't want to post anything on your Facebook wall. snaptasq has its own wall.</strong></p><p>For more information please view our privacy policy <a href=/privacy target=_tab>here</a></p></div></div></div>"
  );


  $templateCache.put('app/account/forgot/forgot.html',
    "<div id=forgotbox class=mainbox><div class=\"panel panel-info\"><!-- <div class=\"panel-heading\">\n" +
    "            <div class=\"panel-title\">Sign In</div>\n" +
    "        </div>      --><div class=panel-body><!-- <div style=\"\" id=\"login-alert\" class=\"alert alert-danger col-sm-12\"></div> --><form id=forgotform class=form-horizontal name=forgotForm role=form ng-submit=sendForgotPassword(forgotForm) novalidate><div style=\"margin-bottom: 25px\" class=input-group><span class=input-group-addon><i class=\"fa fa-envelope\"></i></span> <input type=email name=email class=form-control ng-model=email required placeholder=\"email address\" mongoose-error/></div><div class=form-group><input type=hidden ng-model=captchaResponse name=captchaResponse><label for=captcha class=\"col-md-3 control-label\">Captcha</label><div class=col-md-9><div vc-recaptcha key=\"'6LfjmgcTAAAAAFerg8_alh6LFcb4QQvrF8Gg4qz1'\" on-success=\"captchaResponse=response\"></div></div></div><div style=margin-top:10px class=form-group><!-- Button --><div class=\"col-sm-12 controls\"><button class=\"btn btn-success\" type=submit>Submit</button></div></div></form></div></div></div>"
  );


  $templateCache.put('app/account/notifications/notifications.html',
    "<div class=container><div class=notifications><div class=notification-heading><h4 class=menu-title><i class=\"fa fa-bell\"></i> Notifications</h4></div><div class=notifications-wrapper><a class=content href={{item.link}} ng-repeat=\"item in notifications\"><div class=notification-item><h4 class=item-title>{{item.message}}</h4><p class=item-info am-time-ago=item.created></p></div></a></div></div></div>"
  );


  $templateCache.put('app/account/resetPassword/resetPassword.html',
    "<div class=container><section name=reset-pass class=\"panel panel-primary\"><div class=panel-heading>Change Password</div><div class=panel-body><form class=form name=form ng-submit=resetChangePassword(form) novalidate><div class=form-group><label>New Password</label><input type=password name=newPassword class=form-control ng-model=user.newPassword ng-minlength=3 required/><p class=help-block ng-show=\"(form.newPassword.$error.minlength || form.newPassword.$error.required) && (form.newPassword.$dirty || submitted)\">Password must be at least 3 characters.</p></div><p class=help-block>{{ message }}</p><button class=\"btn btn-lg btn-primary\" type=submit>Change Password</button></form></div></section></div>"
  );


  $templateCache.put('app/account/rewards/rewardInstructions/reward.amazon.html',
    "<ol><li ng-if=_badgeAlerts.IS_MISSING_BETA_CODE()>Enter a beta code</li><li>Create a task and have your friend complete it</li><li>Once your task is completed fill out this <a href=https://www.surveymonkey.com/s/D79Z8LY>short survey here.</a>(just to track the beta)</li><li>Your 5$ Amazon Digital Gift Card will be emailed to the email account you have given us.</li></ol><small>While supplies last, we have hundreds of amazon gift cards if you are wondering.</small>"
  );


  $templateCache.put('app/account/rewards/rewardInstructions/reward.tshirt.html',
    "<p><a href=http://snaptasq.storenvy.com>Follow this link to our store</a></p>"
  );


  $templateCache.put('app/account/rewards/rewards.html',
    "<div class=container id=betaCodeEntry><section class=\"col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\" style=margin-top:50px><div ng-repeat=\"item in rewards\" class=\"panel panel-info\"><div class=panel-heading><div class=panel-title>{{item.title}}<div class=pull-right><small>status: {{item.status}}</small></div></div></div><div class=panel-body><div ng-include src=item.description></div></div></div></section></div>"
  );


  $templateCache.put('app/account/settings/settings.html',
    "<div class=\"container top-buffer\"><section ng-if=\"_me.requiresBeta && _beta\" name=enter-beta-code class=\"panel panel-danger\"><div class=panel-heading><i class=\"fa fa-warning\"></i>&nbsp;Enter a beta code! <span class=badge>1</span></div><div class=panel-body><p>You need to enter a beta code to complete your account regisitration</p><a href=/beta><button class=\"btn btn-primary\">Enter beta code</button></a></div></section><section name=link-fb-account ng-if=userCanFbConnect class=\"panel panel-primary\"><div class=panel-heading>Link Facebook Account</div><div class=panel-body><button id=btn-fbsignup type=button class=\"btn btn-primary\" ng-click=\"loginOauth('facebook');\"><i class=\"fa fa-facebook\"></i>   Continue with Facebook</button></div></section><section name=change-pass class=\"panel panel-primary\"><div class=panel-heading>Change Password</div><div class=panel-body><form class=form name=form ng-submit=changePassword(form) novalidate><div class=form-group><label>Current Password</label><input type=password name=password class=form-control ng-model=user.oldPassword mongoose-error/><p class=help-block ng-show=form.password.$error.mongoose>{{ errors.other }}</p></div><div class=form-group><label>New Password</label><input type=password name=newPassword class=form-control ng-model=user.newPassword ng-minlength=3 required/> <a href=/forgot>Forgot your password?</a><p class=help-block ng-show=\"(form.newPassword.$error.minlength || form.newPassword.$error.required) && (form.newPassword.$dirty || submitted)\">Password must be at least 3 characters.</p></div><p class=help-block>{{ message }}</p><button class=\"btn btn-primary\" type=submit>Save changes</button></form></div></section><section name=delete-account class=\"panel panel-danger\"><div class=panel-heading>Delete Accont</div><div class=panel-body><button class=\"btn btn-danger\" ng-click=showDeleteAccountModal()>Delete</button></div></section></div>"
  );


  $templateCache.put('app/account/signin/partials/choice.partial.html',
    "<div id=choicebox class=mainbox><div class=\"panel panel-info\"><div class=panel-body><div class=form-group><div class=row><div class=col-md-12><button id=btn-fbsignup type=button class=\"btn btn-primary col-md-12 col-sm-12 col-xs-12\" ng-click=\"loginOauth('facebook');\"><i class=\"fa fa-facebook\"></i>   Continue with Facebook</button></div></div></div><div id=or class=col-md-12><div style=\"display: inline-block;width:40%;vertical-align: middle;zoom: 1;height: 1px;background: #cccfd3\"></div><div class=text-center style=\"width:15%;display: inline-block;zoom: 1\">or</div><div style=\"width:40%;display: inline-block;vertical-align: middle;zoom: 1;height: 1px;background: #cccfd3\"></div></div><div class=\"text-center col-md-12 bot-buffer\" style=padding-top:5px><div>Log in or sign up with email</div></div><div class=\"top-buffer row\"><div class=\"col-md-6 col-sm-12 text-center\"><a href=\"/signin?action=login\"><button class=\"btn btn-primary col-md-6 col-md-push-3 col-sm-12 col-xs-12\">Log in</button></a></div><div class=\"col-md-6 col-sm-12 text-center\"><a href=\"/signin?action=register\"><button class=\"btn btn-success col-md-6 col-md-push-3 col-sm-12 col-xs-12\">Sign up</button></a></div></div></div></div></div>"
  );


  $templateCache.put('app/account/signin/partials/register.partial.html',
    "<div id=signupbox class=mainbox><div class=\"panel panel-info\"><div class=panel-body><form id=signupform class=form-horizontal name=signupForm role=form ng-submit=register(signupForm)><div id=signupalert ng-show=\"registerErrors.length!=0\" class=\"alert alert-danger\"><div ng-repeat=\"error in registerErrors\">{{error}}</div></div><div class=form-group><div class=col-md-12><button id=btn-fbsignup type=button class=\"btn btn-primary\" style=width:100% ng-click=\"loginOauth('facebook');\"><i class=\"fa fa-facebook\"></i>   Continue with Facebook</button></div></div><div id=or class=col-md-12><div style=\"display: inline-block;width:40%;vertical-align: middle;zoom: 1;height: 1px;background: #cccfd3\"></div><strong class=\"text-center lead\" style=\"width:15%;display: inline-block;zoom: 1\">or</strong><div style=\"width:40%;display: inline-block;vertical-align: middle;zoom: 1;height: 1px;background: #cccfd3\"></div></div><div class=form-group><label for=name class=\"col-md-3 control-label\">Name</label><div class=col-md-9><input class=form-control name=name ng-model=signupform.name placeholder=\"Jon Doe\" required></div></div><div class=form-group><label for=email class=\"col-md-3 control-label\">Email</label><div class=col-md-9><input type=email class=form-control name=email ng-model=signupform.email placeholder=\"Email Address\"></div></div><!--<div class=\"form-group\">\n" +
    "                  <label for=\"lastname\" class=\"col-md-3 control-label\">Last Name</label>\n" +
    "                  <div class=\"col-md-9\">\n" +
    "                    <input type=\"text\" class=\"form-control\" name=\"lastname\" placeholder=\"Last Name\">\n" +
    "                  </div>\n" +
    "                </div> --><div class=form-group><label for=password class=\"col-md-3 control-label\">Password</label><div class=col-md-9><input type=password class=form-control name=password ng-model=signupform.password placeholder=Password></div></div><div class=form-group><input type=hidden ng-model=signupform.captchaResponse ng-model=signupform.captchaResponse name=captchaResponse><label for=captcha class=\"col-md-3 control-label\">Captcha</label><div class=col-md-9><div vc-recaptcha key=\"'6LfjmgcTAAAAAFerg8_alh6LFcb4QQvrF8Gg4qz1'\" on-success=\"signupform.captchaResponse=response\"></div></div></div><div class=form-group><!-- Button --><div class=col-md-12><button id=btn-signup type=submit class=\"btn btn-info\" style=width:100%><i class=icon-hand-right></i> &nbsp; Join now</button></div></div></form></div></div></div>"
  );


  $templateCache.put('app/account/signin/partials/signin.partial.html',
    "<div id=loginbox class=mainbox><div class=\"panel panel-info\"><!-- <div class=\"panel-heading\">\n" +
    "            <div class=\"panel-title\">Sign In</div>\n" +
    "          </div>      --><div class=panel-body><!-- <div style=\"\" id=\"login-alert\" class=\"alert alert-danger col-sm-12\"></div> --><form id=loginform class=form-horizontal name=form role=form ng-submit=login(form) novalidate><div style=\"margin-bottom: 25px\" class=input-group><span class=input-group-addon><i class=\"fa fa-envelope\"></i></span> <input id=login-username type=email class=form-control name=username placeholder=email ng-model=user.email required></div><div class=input-group><span class=input-group-addon><i class=\"glyphicon glyphicon-lock\"></i></span> <input id=login-password type=password class=form-control name=password placeholder=password ng-model=user.password required></div><!-- <div class=\"input-group\">\n" +
    "                <div class=\"checkbox\">\n" +
    "                  <label>\n" +
    "                    <input id=\"login-remember\" type=\"checkbox\" name=\"remember\" value=\"1\"> Remember me\n" +
    "                  </label>\n" +
    "                </div>\n" +
    "              </div> --><div class=\"col-md-12 form-group has-error\"><p class=help-block ng-show=\"form.email.$error.required && form.password.$error.required && submitted\">Please enter your email and password.</p><p class=help-block ng-show=\"form.email.$error.email && submitted\">Please enter a valid email.</p><p class=help-block>{{ errors.other }}</p></div><div class=form-group><!-- Button --><div class=\"col-sm-12 col-md-12 controls\"><button class=\"btn btn-success\" style=width:100% type=submit>Login</button></div></div><div class=form-group><div class=\"col-md-12 control\"><div style=\"border-top: 1px solid#888; padding-top:15px; font-size:85%\">Don't have an account! <a href=\"/signin?action=register\" ng-click=\"tabSignup=0;tabCreateAccount=1\">Sign Up Here</a></div></div></div></form></div></div></div>"
  );


  $templateCache.put('app/account/signin/signin.html',
    "<div class=container id=loginsAndSignup><section class=\"col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\" style=margin-top:50px><div ng-if=\"!tabSignup && !tabCreateAccount\"><div ng-include src=\"'app/account/signin/partials/choice.partial.html'\"></div></div><div ng-if=\"tabSignup && !tabCreateAccount\"><div ng-include src=\"'app/account/signin/partials/signin.partial.html'\"></div></div><div ng-if=\"!tabSignup && tabCreateAccount\"><div ng-include src=\"'app/account/signin/partials/register.partial.html'\"></div></div></section></div>"
  );


  $templateCache.put('app/account/signin/signin.modal.html',
    "<div ng-controller=SigninCtrl><div class=row><div class=col-sm-12><h1>Sign up</h1><em>Signing up is free and you can delete your account at any time.</em></div><div class=col-sm-12><form class=form name=form class=form-horizontal role=form ng-submit=registerForModalNoRedirect(form,success) novalidate><div class=form-group ng-class=\"{ 'has-success': form.name.$valid && submitted,\n" +
    "        'has-error': form.name.$invalid && submitted }\"><label>Name</label><input name=name class=form-control ng-model=user.name required/><p class=help-block ng-show=\"form.name.$error.required && submitted\">A name is required</p></div><div class=form-group ng-class=\"{ 'has-success': form.email.$valid && submitted,\n" +
    "      'has-error': form.email.$invalid && submitted }\"><label>Email</label><input type=email name=email class=form-control ng-model=user.email required mongoose-error/><p class=help-block ng-show=\"form.email.$error.email && submitted\">Doesn't look like a valid email.</p><p class=help-block ng-show=\"form.email.$error.required && submitted\">What's your email address? It is only used to email you if you forgot your password or need customer support.</p><p class=help-block ng-show=form.email.$error.mongoose>{{ errors.email }}</p></div><div class=form-group ng-class=\"{ 'has-success': form.password.$valid && submitted,\n" +
    "    'has-error': form.password.$invalid && submitted }\"><label>Password</label><input type=password name=password class=form-control ng-model=user.password ng-minlength=3 required mongoose-error/><p class=help-block ng-show=\"(form.password.$error.minlength || form.password.$error.required) && submitted\">Password must be at least 3 characters.</p><p class=help-block ng-show=form.password.$error.mongoose>{{ errors.password }}</p></div><div class=form-group><input type=hidden ng-model=captchaResponse name=captchaResponse><br><div vc-recaptcha data-size=normal key=\"'6LfjmgcTAAAAAFerg8_alh6LFcb4QQvrF8Gg4qz1'\" on-success=\"captchaResponse=response\"></div></div><div><button class=\"btn btn-inverse btn-lg btn-login\" type=submit>Sign up</button><!-- //TODO handle the login case for the modal --><!-- <a class=\"btn btn-default btn-lg btn-register\" href=\"/login\">\n" +
    "            Login\n" +
    "          </a> --></div></form></div></div></div>"
  );


  $templateCache.put('app/admin/admin.html',
    "<div class=\"container top-buffer\"><h1>View Users</h1><ul class=list-group><li class=list-group-item ng-repeat=\"user in users\"><strong>{{user.name}}</strong><br><span class=text-muted>{{user.email}}</span><!-- <a ng-click=\"delete(user)\" class=\"trash\"><span class=\"glyphicon glyphicon-trash pull-right\"></span></a> --></li></ul></div>"
  );


  $templateCache.put('app/admin/beta/beta.html',
    "<div class=\"container top-buffer\"><section name=change-pass class=\"panel panel-primary\"><div class=panel-heading>Create Beta Code</div><div class=panel-body><form class=form name=form ng-submit=generateBetaCode(form) novalidate><div class=form-group><label>Number of Beta Code Uses (max: 100)</label><input type=number value=0 name=codeUses class=form-control ng-model=\"codeUses\"/><p class=help-block ng-show=\"codeUses > 100\">Code uses can only be 100 or less.</p></div><div class=form-group><label>Beta Code Prefix (i.e. SNAPT-ASQ2015-X3IA-F523)</label><input maxlength=10 name=codePrefix class=form-control ng-model=codePrefix capitalize/><p class=help-block ng-show=\"codePrefix.length > 10\">Limited to 10 characters</p><strong>Example Preview Beta code : {{previewCode}}</strong></div><button class=\"btn btn-lg btn-primary\" type=submit>Generate</button><div ng-if=generatedBetaCode>Your Code is {{generatedBetaCode}}</div></form></div></section><section name=view-codes class=\"panel panel-seondary\"><div class=\"row well\" ng-repeat=\"code in betaCodes\"><div class=col-md-4><h2>{{code.name}}</h2></div><div class=col-md-4><div class=lead>Uses : {{code.uses}}/{{code.maxUses}}</div><div class=lead>Created : {{code.created | date:'longDate'}}</div><div class=lead>Status : {{code.status}}</div></div><div class=col-md-4><div class=top-buffer><button ng-show=\"code.status=='active'\" class=\"btn btn-warning\" ng-click=deactivate(code);>Deactivate</button> <button ng-show=\"code.status=='inactive'\" class=\"btn btn-success\" ng-click=activate(code);>Activate</button> <button class=\"btn btn-danger\" ng-click=delete(code);>Delete</button></div></div></div></section></div>"
  );


  $templateCache.put('app/admin/community/community.html',
    "<div class=\"container top-buffer\"><section name=change-pass class=\"panel panel-primary\"><div class=panel-heading>Create Community</div><div class=panel-body><form class=form name=form ng-submit=createCommunity(form) novalidate><div class=form-group><label>Name</label><input name=name ng-model=name class=form-control required/><p class=help-block ng-show=\"name.length > 64\">Name must be under 64 letters long</p><p class=help-block ng-show=\"form.name.$error.required && submitted\">Please enter a name</p></div><div class=form-group><label>Entry Method</label><select ng-model=selectedItem name=entryMethod ng-options=\"item as item.name for item in entryMethods\" required></select><p class=help-block ng-show=\"form.entryMethod.$error.required && submitted\">Please select an entry method</p></div><div class=form-group><label>Entry Parameter</label><input value=0 name=entryParam class=form-control ng-model=\"formCommunity.entryParam\"/><p class=help-block ng-show=\"formCommunity.entryParam < 32\">Name must be under 32 letters long</p></div><button class=\"btn btn-lg btn-primary\" type=submit>Create</button></form></div></section><section name=view-codes class=\"panel panel-seondary\"><div class=\"row well\" ng-repeat=\"item in communities\"><div class=col-md-4><h2>{{item.name}}</h2></div><div class=col-md-4><div class=lead>entryMethod : {{item.entryMethod}}</div><div class=lead>entryParam : {{item.entryParam}}</div><div class=lead>created : {{item.created | date:'longDate'}}</div></div><div class=col-md-4><div class=top-buffer><button class=\"btn btn-danger\" ng-click=delete(item);>Delete</button></div></div></div></section></div>"
  );


  $templateCache.put('app/communities/communities.html',
    "<div class=container><section class=col-md-12 style=margin-top:50px><div class=\"panel panel-info\"><div class=panel-body><h1 style=display:inline class=text-center>Private Community Tasqs</h1><button class=\"btn btn-info pull-right\" ng-click=showSuggestCommunityModal()><i class=\"fa fa-plus\"></i>&nbsp;Suggest Community</button><ul><li ng-repeat=\"item in communities\"><a href=# class=lead>{{item.name}}</a></li></ul></div></div></section><section class=col-md-12 style=margin-top:50px><div class=\"panel panel-info\"><div class=panel-body><h1 style=display:inline class=text-center>Public Community Tasqs</h1><button class=\"btn btn-info pull-right\" ng-click=showSuggestCommunityModal()><i class=\"fa fa-plus\"></i>&nbsp;Suggest Community</button><ul><li ng-repeat=\"item in publiccommunities\"><a href=# class=lead>{{item.name}} Tasqs</a></li><li ng-if=!publiccommunites>None</li></ul></div></div></section></div>"
  );


  $templateCache.put('app/main/main.html',
    "<div style=\"background: url(assets/images/main/top_image.png) no-repeat center 20%;\n" +
    "background-size: cover;\n" +
    "min-height:750px\"><div ng-attr-style=\"margin: auto; text-align: center;\" class=text-center><section class=main-top-image-controls><h1>Friends Help FriendS</h1><h3>get help from the people you already know</h3><div style=\"margin-top:15px; pointer-events: all\"><input id=mainsearch scroll-on-click=-15px autofocus ng-model=searchTask typeahead=\"task.name for task in commonTasks | filter:$viewValue | limitTo:8 | typeAheadNoResultsOnEmpty:$viewValue\" class=input-lg placeholder=\"What do you need done?\" typeahead-template-url=components/typeahead/customTemplate.html typeahead-on-select=\"handleSearch($item, $model, $label)\"/></div></section></div></div><div class=container-fluid ng-attr-style=\"background:{{snapYellowCSS}};padding-bottom:40px;border-bottom:1px solid black;\"><!-- how it works --><div class=row style=margin-top:35px><h2 class=\"text-center main-slogans\">this is how snaptasq works</h2></div><div class=row style=\"display: table;margin: 0 auto\"><div style=\"display: table;margin: 0 auto\"><div class=\"text-center col-md-4 col-sm-4 col-xs-4\" style=\"padding: 0;display:inline-block;float:left\"><div ng-attr-style=background:{{snapYellowCSS}};><img src=assets/images/main/snaptasq_steps1.png ng-attr-style=\"background:{{snapYellowCSS}};max-width:100%;\"/></div><h2 class=mini-slogans style=color:black>create your tasq</h2><!-- <h4>describe your tasq.</h4> --></div><div class=\"text-center col-md-4 col-sm-4 col-xs-4\" style=\"padding: 0;display:inline-block;float:left\"><div ng-attr-style=background:{{snapYellowCSS}};><img src=assets/images/main/snaptasq_steps2.png ng-attr-style=\"background:{{snapYellowCSS}};max-width:100%;\"/></div><h2 class=mini-slogans>share with friends</h2><!-- <h4>next, share your tasq on your social networks.</h4> --></div><div class=\"text-center col-md-4 col-sm-4 col-xs-4\" style=\"padding: 0;display:inline-block;float:left\"><div ng-attr-style=background:{{snapYellowCSS}};><img src=assets/images/main/snaptasq_steps3.png ng-attr-style=\"background:{{snapYellowCSS}};max-width:100%;\"/></div><h2 class=mini-slogans>tasq accomplished</h2><!-- <h4>now that your friends will help, your tasq will be finished.</h4> --></div></div></div></div><!-- <header class=\"hero-unit\" style=\"padding-top:50px;background:#fcd11a\" id=\"wallFeed\">\n" +
    "    <div class=\"container-fluid\">\n" +
    "    <div class=\"row\">\n" +
    "    <div class=\"col-md-12\">\n" +
    "        <slick dots=\"true\" infinite=\"true\" arrows=\"true\" nextArrow=\"true\" prevArrow=\"true\" speed=\"300\" slides-to-show=\"1\" slides-to-scroll=\"1\">\n" +
    "            <div ng-repeat=\"slide in slides\" class=\"col-md-12\">\n" +
    "                <img class=\"noselect\" draggable=\"false\" ng-src=\"{{slide.image}}\" style=\"margin:auto;max-width:30%;max-height:50%\">\n" +
    "            </div>\n" +
    "        </slick>\n" +
    "        <p class=\"lead\" style=\"color:black;\">swipe to see more</p>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "</header> --><div style=background:#f5f6f6><div class=\"container marketing\"><!-- task panels --><div class=row style=margin-top:20px;margin-bottom:20px><h2 class=\"text-center main-slogans\">get any tasq done in a snap</h2></div><div style=padding-top:5px;padding-bottom:5px><div ng-repeat=\"task in advertisedTasks  | limitTo:3:0\" class=\"col-md-4 col-sm-4 col-xs-6\" style=\"cursor:pointer; padding-right:5px;padding-left:5px\" ng-click=launchTaskCreateWithName(task.prefill);><img style=\"width: 100%;height:100%;object-fit: contain;overflow: hidden\" ng-src=\"{{task.img}}\"/><div class=text-center style=position:relative;z-index:2;bottom:100px;color:white><strong style=font-size:1.4em>{{task.name}}</strong></div></div></div><div class=row style=padding-top:5px;padding-bottom:5px><div ng-repeat=\"task in advertisedTasks  | limitTo:3:3\" class=\"col-md-4 col-sm-4 col-xs-6\" style=\"cursor:pointer; padding-right:5px;padding-left:5px\" ng-click=launchTaskCreateWithName(task.prefill);><img style=\"width: 100%;height:100%;object-fit: contain;overflow: hidden\" class=mosaicRollover ng-src={{task.img}} ng-click=\"\"/><div class=text-center style=position:relative;z-index:2;bottom:100px;color:white><strong style=font-size:1.4em>{{task.name}}</strong></div></div></div></div><!-- /.container --></div><div class=\"container marketing\"><!-- why use --><div class=row style=margin-top:35px><h1 class=text-center>why snaptasq?</h1></div><div class=row><div class=col-lg-4><img src=assets/images/main/why1.png width=\"128px\"/><p class=loud>help from your friends</p><p>Who better to ensure the task gets done right than your friends. You can even handpick who you would like to handle the task.</p></div><!-- /.col-lg-4 --><div class=col-lg-4><img src=assets/images/main/why2.png width=\"128px\"/><p class=loud>safety assured</p><p>Only your friends can see your tasks. This helps keep you safe and protected.</p></div><!-- /.col-lg-4 --><div class=col-lg-4><img src=assets/images/main/why3.png width=\"128px\"/><p class=loud>never by strangers</p><p>Unlike our competitors, we only let your friends apply for your tasks to avoid any issues.</p></div><!-- /.col-lg-4 --></div><!-- /.row --><div class=row><div class=col-lg-4><img src=assets/images/main/why4.png width=\"128px\"/><p class=loud>instant communication</p><p>Message your friends to coordinate your task easily.</p></div><!-- /.col-lg-4 --><div class=col-lg-4><img src=assets/images/main/why5.png width=\"128px\"/><p class=loud>group sourcing</p><p>We ensure that your task will have multiple backups readily available for you.</p></div><!-- /.col-lg-4 --><div class=col-lg-4><img src=assets/images/main/why6.png width=\"128px\"/><p class=loud>offer incentives</p><p>Our service is free. However, you can offer taskers cash rewards in person.</p></div><!-- /.col-lg-4 --></div><!-- /.row --></div>"
  );


  $templateCache.put('app/pricePoints/pricePoints.html',
    "<div class=container ng-controller=PricePointsModalCtrl><div class=row><div class=col-md-12><h1 class=lead>What is a price Point?</h1><span>This is how much you are willing to pay someone who helps you complete this tasq. Below are examples of common prices</span></div></div><div class=row><div class=col-md-12><h2 class=lead>Free Tasks</h2></div></div><ul><li><strong>Borrowing Stuff</strong>Example: Does anyone have an electric drill that we could borrow for an hour? Attempting to build a picnic table at Kappa</li></ul><div class=row><div class=col-md-12><h2 class=lead>Small tasks 1-10$</h2></div></div><ul><li><strong>Pet Sitting</strong>Example: 6 pack of Stella and two glow in the dark dice +$6 and playtime with puppy Clara at boo.</li><li><strong>Transportation Short Distances</strong>Example: $5 for someone to pick me up at CalTrain at 11:05. Message me</li><li><strong>On Campus Food</strong>Example: $6 plus cost for a bottle of yellow tail Pinot Grigio, goat cheese and a French baguette to B5</li></ul><div class=row><div class=col-md-12><h2 class=lead>Medium tasks 10-20$</h2></div></div><ul><li><strong>Moving Furnature</strong>Example: $15 Housemate needs bed moved from Flamingo to Park Centrals tomorrow anytime after 6pm. Need a truck.Example: $20 and a 30 rack to whoever can help my mom move a mattress from Tenspot to Oasis tomorrow!Example: $15 to anyone who could help me move a couch tonight or tomorrow morning before 10 am! Please I'm small</li><li><strong>Transportation</strong>Example: $15 for someone to pick me up from SJC at 9:30 tonightExample: $25 for someone to move a mattress from 840 poplar to cabana on july 7. Message me!</li></ul><div class=row><div class=col-md-12><h2 class=lead>Big tasks over 20$</h2></div></div><ul><li><strong>Transportation Long Distances</strong>Example: $25 for a ride to Santa Clara Univeristy from SFO at 12:45pm today.Example: Hey $40 for someone to drive from santa clara to san jose and back asap.</li></ul><div class=row><div class=col-md-12><h2 class=lead>Hourly Tasks</h2></div></div><ul><li><strong>Moving Stuff</strong>Example: 15$/hour if anyone can help lug boxes and some light furniture from a first floor apartment at Park Central to a Uhaul around 3:30 I can pay $15 an hour</li></ul></div>"
  );


  $templateCache.put('app/requestBeta/requestbeta.html',
    "<div class=container><section class=\"col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\" style=margin-top:50px><div class=\"panel panel-info\"><div class=panel-body><p>If you can not find a beta code, you can get one via our beta mailing list, simply enter your email address below and we will send you a code. (this is done manually, please be patient)</p><p>Last Beta Email Giveaway: <strong>August 1st, 2015</strong></p><div beta-email-sign-up=\"\" style=padding-bottom:10px></div></div></div></section></div>"
  );


  $templateCache.put('app/task/components/applicants.modal.html',
    "<div class=row ng-controller=TaskApplicantList><div class=col-md-12><button class=\"btn btn-warning bot-buffer\" ng-if=\"modal.task.ownerId==_me._id\" ng-click=setTasker(modal.task); ng:disabled=!modal.task.tasker.id>Set to unpicked</button></div><div class=col-md-12 ng-repeat=\"item in modal.task.applicants\"><img ng-if=item.pic src={{item.pic}} style=\"height:50px;width:50px;margin-right:5px\"/><a ng-if=item.fbId href=http://www.facebook.com/{{item.fbId}}>{{item.name}}</a><span ng-if=!item.fbId>{{item.name}}</span> <button ng-if=\"modal.task.ownerId==_me._id && modal.task.tasker.id!=item.id\" class=\"btn btn-info pull-right\" ng-click=setTasker(modal.task,item.id);>Set as tasker</button> <button ng-if=\"modal.task.tasker.id==item.id\" class=\"btn btn-success pull-right\" ng:disabled=true>Chosen</button></div></div>"
  );


  $templateCache.put('app/task/components/taskViewCompact.directive.html',
    "<div class=row><div class=col-md-12><div style=float:left;margin-right:10px><img src={{task.ownerPic}} style=\"height:50px;width:50px\"/></div><div><strong>{{task.ownerName}}</strong>&nbsp;<span>{{task.created | date:'MMM d, y h:mm a'}}</span> <span style=position:relative;z-index:2 ng-if=task.reward.money class=\"fa-stack fa-sm\"><i class=\"fa fa-circle-thin fa-stack-2x\"></i> <i class=\"fa fa-dollar fa-stack-1x\"></i></span></div></div></div><div class=row><div class=col-md-12><div style=font-size:1.5em><a href=/task/view/{{task._id}}>{{task.name}}</a></div></div></div>"
  );


  $templateCache.put('app/task/components/taskViewCompactList.directive.html',
    "<div class=\"row ng-cloak\" ng-if=\"_me._id && task.tasker.id==_me._id\"><div class=col-md-12><p ng-if=!task.tasker.confirmed class=\"lead text-info\">{{task.ownerName}} has chosen you to help. Do you accept? <button ng-if=!task.tasker.confirmed class=\"btn btn-success\" ng-click=taskerConfirmTask(task,true);>Accept</button> <button ng-if=!task.tasker.confirmed class=\"btn btn-error\" ng-click=taskerConfirmTask(task,false);>Reject</button></p></div></div><div class=row><div class=\"col-md-9 col-sm-9 col-xs-12\"><div style=float:left;margin-right:10px><img src={{task.ownerPic}} style=\"height:50px;width:50px\"/></div><div><strong>{{task.ownerName}}</strong>&nbsp;<span>{{task.created | date:'MMM d, y h:mm a'}}</span>&nbsp;<span class=\"badge badge-info\">{{task.status | capslock}}</span> <span style=position:relative;z-index:2 ng-if=task.payout class=\"fa-stack fa-sm\"><i class=\"fa fa-circle-thin fa-stack-2x\"></i> <i class=\"fa fa-dollar fa-stack-1x\"></i></span></div><div class=single-line-dots style=font-size:1.5em><a href=/task/view/{{task._id}}>{{task.name}}</a></div></div><div class=\"col-md-3 col-sm-3 col-xs-12\"><div style=display:inline;padding-right:5px id=applicantIcon><a href=\"\" ng-click=showApplicants(task)><span style=font-size:2em>&nbsp;{{task.applicants.length}}</span><i class=\"fa fa-user fa-2x\"></i></a></div><div style=display:inline;color:green id=moneyIcon ng-if=task.payout><i class=\"fa fa-dollar fa-2x\"></i><span style=font-size:2em>{{task.payout}}</span></div><div id=currentTasker ng-if=\"task.tasker.id && task.tasker.confirmed\"><img ng-if=task.tasker.pic src={{task.tasker.pic}} style=\"height:50px;width:50px;margin-right:5px\"/><a ng-if=task.tasker.fbId href=http://www.facebook.com/{{task.tasker.fbId}}>{{task.tasker.name}}</a><span ng-if=!task.tasker.fbId>{{task.tasker.name}} is helping out</span></div></div></div><!-- if i am the tasker i will see this -->"
  );


  $templateCache.put('app/task/task.edit.html',
    "<div class=\"container top-buffer\" ng-controller=TaskEditCtrl><div class=row><div class=col-sm-12><p class=lead>My Task <button ng-click=cancelEditingTask(task); type=button class=\"btn btn-danger pull-right\" style=height:46px>Cancel</button></p></div><div class=col-sm-12 ng-if=\"action=='create' || action=='update'\"><form class=form name=form ng-submit=createTask(form) novalidate><div class=form-group ng-class=\"{ 'has-success': form.name.$valid && submitted,\n" +
    "        'has-error': form.name.$invalid && submitted }\"><label>Title</label><input scroll-on-click-mobile=-15px placeholder=\"Ex: $15 to anyone who could help me move a couch tonight or tomorrow morning before 10 am! Please I'm small\" maxlength=128 name=name class=form-control ng-model=task.name required/><p class=help-block ng-show=\"form.name.$error.required && submitted\">A title is required</p></div><div class=form-group ng-class=\"{ 'has-success': form.location.$valid && !errors.location && submitted,\n" +
    "      'has-error': (form.location.$invalid || errors.location) && submitted }\"><label>Location</label><input scroll-on-click-mobile=-15px class=form-control name=location ng-autocomplete ng-model=task.location.name options=options details=task.location.details required/><p class=help-block ng-show=\"form.location.$error.required && submitted\">A location is required</p><p class=help-block ng-show=\"errors.location && submitted\">Please re-enter the location</p></div><div class=form-group ng-class=\"{ 'has-success': form.name.$valid && submitted,\n" +
    "    'has-error': form.name.$invalid && submitted }\"><label popover-placement=right popover=\"It is reccomended you learn how to set price points accurately, clicking the link won't clear your task information\" popover-trigger=mouseenter>{{1000.23 | currency:\"$\"}} Reward Price (can be free, <a href=/pricePoints target=_tab>learn how to set price points</a>)</label><div><strong>Current Price Category: {{task.payout | pricePointCategory}}</strong></div><label style=margin-right:5px></label><div class=clearfix><input scroll-on-click-mobile=-15px size=7 format-as-currency=\"\" style=display:inline ng-model=task.payout popover-placement=right popover=\"By offering as little as 5$ it greatly increases the chances of success\" required/></div></div><div class=form-group ng-class=\"{ 'has-success': form.description.$valid && submitted,\n" +
    "      'has-error': (form.description.$invalid || errors.description) && submitted }\"><label>Additional Details (Optional)</label><textarea scroll-on-click-mobile=-15px placeholder=\"Ex: Couch is small enough to fit in an SUV.\" name=description cols=40 maxlength=1000 rows=5 ng-model=task.description class=form-control></textarea><p class=help-block ng-show=\"errors.description && submitted\">A description is optional. Limited to 1000 characters.</p></div><div class=\"row bot-buffer\"><div class=col-md-12><button class=\"btn btn-info btn-lg\" type=submit>Next</button> <button ng-if=task._id ng-click=deleteTask(task); type=button class=\"btn btn-danger pull-right\" style=height:46px>Delete Task</button></div></div></form></div></div></div>"
  );


  $templateCache.put('app/task/task.view.html',
    "<div class=\"container top-buffer\"><div class=row><div class=\"col-md-7 col-sm-12\"><div class=\"row ng-cloak\" ng-if=\"_me._id && task.tasker.id==_me._id\"><div class=col-md-12><p ng-if=!task.tasker.confirmed class=\"lead text-info\">{{task.ownerName}} has chosen you to help. Do you accept? <button ng-if=!task.tasker.confirmed class=\"btn btn-success\" ng-click=taskerConfirmTask(task,true);>Accept</button> <button ng-if=!task.tasker.confirmed class=\"btn btn-error\" ng-click=taskerConfirmTask(task,false);>Reject</button></p></div></div><div class=row id=currentTasker ng-if=task.tasker.id><div class=col-md-12><div><img ng-if=task.tasker.pic src={{task.tasker.pic}} style=\"height:50px;width:50px;margin-right:5px\"/><a ng-if=task.tasker.fbId href=http://www.facebook.com/{{task.tasker.fbId}}>{{task.tasker.name}}</a><span ng-if=!task.tasker.fbId>{{task.tasker.name}} (<strong>Current <span ng-if=task.tasker.confirmed>active</span> Tasker</strong>)</span></div></div></div><div class=row id=buttonControls><div class=col-md-12><button ng-click=showApplicants(task) class=\"btn btn-info\" style=height:46px>View <span ng-if=\"task.applicants.length>0\">{{task.applicants.length}}</span> Applicants</button> <span ng-if=\"task.ownerId!=_me._id\"><button ng-if=canApplyToTask(task,_me); ng-click=applyToTask(task) class=\"btn btn-success\" style=height:46px>Apply to Task</button> <button ng-if=canUnapplyToTask(task,_me) ng-click=unapplyToTask(task) class=\"btn btn-warning\" style=height:46px>Unapply to Task</button></span><!-- task owner buttons --> <span ng-if=\"task.ownerId==_me._id\"><a href=/task/update/{{task._id}}><button class=\"btn btn-warning\" style=height:46px>Edit Task</button></a></span></div></div><div class=\"row top-buffer\"><div class=col-md-12><div><div style=float:left;margin-right:10px><img src={{task.ownerPic}} style=\"height:50px;width:50px\"/></div><div><strong>{{task.ownerName}}</strong>&nbsp;<span>{{task.created | date:'MMM d, y h:mm a'}}</span>&nbsp;<span class=\"badge badge-info\">{{task.status | capslock}}</span></div><div style=font-size:1.5em><a href=/task/view/{{task._id}}>{{task.name}}</a></div></div><div class=pull-right></div></div></div><div class=row><div class=col-md-12>{{task.description}}</div></div><div class=row ng-if=\"task.ownerId==_me._id && task.applicants.length==0\"><div class=\"col-md-12 lead\">No one has applied yet. Try sharing your task via the share buttons.</div></div><div class=\"row top-buffer\"><div class=col-md-12><div onrender=rendered() class=fb-comments data-href={{_hostName}}/task/view/{{task._id}}#{{task._id}} data-numposts=3 data-colorscheme=light></div></div></div></div><!--./col-md-7--><div class=\"col-md-5 col-sm-12\"><div class=row><div class=col-md-12><!--share stuff --><!-- Facebook Share Button --><a class=\"btnz share facebook\" ng-click=\"_share('fb',task.name,task.description)\" href=#><i class=\"fa fa-facebook\"></i> Share</a><!-- Googple Plus Share Button --><!-- <a class=\"btnz share gplus\" href=\"#\"><i class=\"fa fa-google-plus\"></i> Share</a> --> <a href=# ng-click=\"_share('google',task.name,task.description)\"><img src=https://www.gstatic.com/images/icons/gplus-64.png style=height:46px alt=\"Share on Google+\"/></a><!-- Twitter Share Button --> <a class=\"btnz share twitter\" href=\"https://twitter.com/intent/tweet?text={{task.name}}&hashtags=snaptasq\"><i class=\"fa fa-twitter\"></i> Tweet</a><!-- Stumbleupon Share Button --><!-- <a class=\"btnz share stumbleupon\" href=\"#\"><i class=\"fa fa-stumbleupon\"></i> Stumble</a> --><!-- Pinterest Share Button --> <a href=# class=\"btnz share pinterest\" ng-click=\"_share('pintrest',task.name,task.description)\"><i class=\"fa fa-pinterest\"></i> Pin it</a><!-- LinkedIn Share Button --><!-- <a class=\"btnz share linkedin\" href=\"#\"><i class=\"fa fa-linkedin\"></i> LinkedIn</a> --><!-- Buffer Share Button --> <a href=https://bufferapp.com/add class=buffer-add-button data-count=horizontal>Buffer</a><script src=https://static.bufferapp.com/js/button.js></script><!-- \n" +
    "        <a class=\"btnz share buffer\" href=\"#\"><i class=\"fa fa-share-square-o\"></i> Buffer</a> --></div></div><div class=row id=googleMaps><div ng-if=!_isMobile class=col-md-12><div ui-gmap-google-map fullscreen center=task.locationCopy.geo.center zoom=15><div ui-gmap-marker coords=task.location.geo.center options=marker.options idkey=0></div></div></div><div ng-if=_isMobile class=\"col-sm-6 col-md-6\"><div ui-gmap-google-map center=task.locationCopy.geo.center zoom=15><div ui-gmap-marker coords=task.location.geo.center options=marker.options idkey=0></div></div></div></div><!-- <div class=\"row\">\n" +
    "        <div class=\"col-md-12\">\n" +
    "        <div ng-if=\"task.location.formattedName\" class=\"lead\">In {{task.location.formattedName}}</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    --><!--        <div class=\"container-outer\">\n" +
    "           <div class=\"container-inner\">\n" +
    "              <img src=\"http://lorempixel.com/400/400/\" ng-repeat=\"x in [1,2,3,4,5,6,7,8]\" style=\"height:128px;width:128px;float:left;white-space: nowrap;display:inline;\" fullscreen/>\n" +
    "          </div>\n" +
    "      </div>\n" +
    "--></div></div></div>"
  );


  $templateCache.put('app/task/tasks.html',
    "<div class=\"container top-buffer\"><div id=actionButtons><div class=\"row bot-buffer\"><div class=col-md-2><a href=/task/create><button class=\"btn btn-info\">Create New</button></a></div></div></div><div ng-if=\"tasks.length==0\" class=\"ngcloak row top-buffer\"><div class=col-md-12><span ng-if=\"typeTasks=='mine'\">You have no tasks yet.</span> <span ng-if=\"typeTasks=='applied'\">You have not applied to any tasks yet.</span></div></div><div class=top-buffer><div ng-show=\"display.mode=='list'\"><div class=\"well top-buffer\" ng-repeat=\"task in tasks | searchTaskFilter:filter\"><div class=task-view-compact-list task=task></div></div></div></div></div>"
  );


  $templateCache.put('components/commentBox/commentBox.directive.template.html',
    "<div class=detailBox><div class=titleBox><p><img style=padding-right:10px src=\"http://lorempixel.com/50/50/people/5\"/><label>{{commentBox.name}}</label><button type=button class=close aria-hidden=true ng-click=close()><i class=\"fa fa-minus-square\"></i></button></p></div><div class=commentBox><p class=taskDescription>{{commentBox.description}}</p></div><div class=actionBox><ul class=commentList><li><div class=commenterImage><img src=\"http://lorempixel.com/50/50/people/6\"/></div><div class=commentText><p>I can help.</p><span class=\"date sub-text\">on {{commentBox.date}}</span></div></li><li><div class=commenterImage><img src=\"http://lorempixel.com/50/50/people/7\"/></div><div class=commentText><p>Has accepted this task.</p><span class=\"date sub-text\">on {{commentBox.date}}</span></div></li><li><div class=commenterImage><img src=\"http://lorempixel.com/50/50/people/9\"/></div><div class=commentText><p>Hello this is a test comment.</p><span class=\"date sub-text\">on {{commentBox.date}}</span></div></li></ul><form class=form-inline role=form><div class=form-group><input class=form-control placeholder=\"Your comments\"/></div><div class=form-group><button class=\"btn btn-default\">Add</button></div></form></div></div>"
  );


  $templateCache.put('components/footer/footer.html',
    "<footer class=footer><div class=container><div class=row><div class=\"col-xs-4 col-sm-4 col-md-4 col-lg-4\"><div><span class=lead style=color:black>discover</span></div><div><div><a href=\"/\" style=color:black>how it works</a></div><div><a href=/privacy style=color:black>privacy</a></div><div><a href=/terms style=color:black>terms</a></div></div></div><div class=\"col-xs-4 col-sm-4 col-md-4 col-lg-4\"><div><span class=lead style=color:black>learn</span></div><div><div><a href=http://blog.snaptasq.com style=color:black>read our blog</a></div><div><a href=/about style=color:black>meet the team</a></div></div></div><div class=\"col-md-4 pull-right\"><div style=\"padding-top: 10px\"><a href=\"\" style=color:black ng-click=scrollTop()><i class=\"fa fa-caret-up\"></i>&nbsp;back to top</a></div></div></div><div class=row><p class=text-center style=color:black>&copy; 2015 snaptasq</p></div></div></footer>"
  );


  $templateCache.put('components/modal/modal.html',
    "<div class=modal-header><button ng-if=modal.dismissable type=button ng-click=$dismiss() class=close>&times;</button><h4 ng-if=modal.title ng-bind=modal.title class=modal-title></h4></div><div class=modal-body><p ng-if=modal.text ng-bind=modal.text></p><div ng-if=modal.html ng-bind-html-unsafe=modal.html></div><div ng-if=modal.htmlInclude ng-include src=modal.htmlInclude></div></div><div class=modal-footer><button ng-repeat=\"button in modal.buttons\" ng-class=button.classes ng-click=button.click($event) ng-bind=button.text class=btn></button></div>"
  );


  $templateCache.put('components/navbar/navbar.html',
    "<div class=\"navbar navbar-default navbar-static-top\" ng-class=\"{'navbar-full-opacity': !isMainPage }\" ng-controller=NavbarCtrl><div class=container><div class=navbar-header><button class=navbar-toggle type=button ng-click=\"isNotCollapsed = !isNotCollapsed\"><span class=sr-only>Toggle navigation</span> <span class=icon-bar></span> <span class=icon-bar></span> <span class=icon-bar></span></button> <a href=\"/\" class=navbar-brand style=color:white;font-size:20px;font-weight:bold popover-placement=right popover-popup-delay=1000 popover=\"A Santa Clara University Project\" popover-trigger=mouseenter><img src=assets/logos/scuLogo.png width=32px style=\"padding-right:5px\"/>snaptasq</a></div><div collapse=isNotCollapsed class=\"navbar-collapse collapse\" id=navbar-main><ul class=\"nav navbar-nav\"><li class=\"dropdown hide-when-collapsed-navbar\" ng-if=\"!isUserBetaLocked && isLoggedIn()\"><a href=/tasks/mine class=dropdown-toggle data-toggle=dropdown data-hover=dropdown>Tasq<b class=caret></b></a><ul class=dropdown-menu><li ng-repeat=\"item in menuTask\" ng-class=\"{active: isActive(item.link)}\"><a ng-href={{item.link}} ng-if=\"isLoggedIn() && (!item.reqBeta || !isUserBetaLocked)\">{{item.title}}&nbsp;<span class=badge ng-if=\"item.count()>0\">{{item.count()}}</span></a></li></ul></li><li ng-repeat=\"item in menuTask\" class=show-only-when-collapsed-navbar ng-class=\"{active: isActive(item.link)}\"><a ng-href={{item.link}} ng-if=\"isLoggedIn() && (!item.reqBeta || !isUserBetaLocked)\">{{item.title}}&nbsp;<span class=badge ng-if=\"item.count()>0\">{{item.count()}}</span></a></li><li class=\"dropdown hide-when-collapsed-navbar\" ng-if=\"isLoggedIn() && isAdmin()\"><a href=# class=dropdown-toggle data-toggle=dropdown data-hover=dropdown>Admin<b class=caret></b></a><ul class=dropdown-menu><li ng-repeat=\"item in menuAdmin\" ng-class=\"{active: isActive(item.link)}\"><a ng-href={{item.link}} ng-if=\"isLoggedIn() && (!item.reqBeta || !isUserBetaLocked)\">{{item.title}}&nbsp;<span class=badge ng-if=\"item.count()>0\">{{item.count()}}</span></a></li></ul></li><li ng-repeat=\"item in menuAdmin\" class=show-only-when-collapsed-navbar ng-class=\"{active: isActive(item.link)}\"><a ng-href={{item.link}} ng-if=\"isLoggedIn() && (!item.reqBeta || !isUserBetaLocked)\">{{item.title}}&nbsp;<span class=badge ng-if=\"item.count()>0\">{{item.count()}}</span></a></li><li id=myMenu ng-repeat=\"item in menu\" class=ng-cloak ng-class=\"{active: isActive(item.link)}\"><a ng-href={{item.link}}>{{item.title}}</a></li><li id=loggedOutMenu ng-if=!isLoggedIn() class=ng-cloak><a ng-href=\"/signin?action=register\" style=position:relative;top:10px;text-transform:uppercase;font-weight:bold;padding:5px><span style=\"border:2px solid black;border-radius:5px;padding:5px\">Become a beta tester</span></a></li></ul><ul class=\"nav navbar-nav navbar-right\"><li ng-hide=isLoggedIn() ng-class=\"{active: isActive('/login')}\"><a href=/signin style=text-transform:uppercase>Log In</a></li><li><div style=\"margin-top: 10px;padding-right: 5px;margin-left:15px\"><a href=\"/signin?action=register\"><button id=signUpButton class=\"btn btn-success\" style=background:black;border:0 ng-hide=isLoggedIn() style=text-transform:uppercase>Sign Up</button></a></div></li><li ng-show=isLoggedIn() ng-class=\"{active: isActive('/settings')}\"><a href=/settings><span><img style=height:20px;padding-right:5px ng-if=currentUser.pic class=ng-cloak ng-src=\"{{currentUser.pic}}\"/>{{ currentUser.name }} <span ng-if=\"_badgeAlerts.size()>0\" class=badge>{{_badgeAlerts._size}}</span></span></a></li><li ng-show=isLoggedIn()><div class=show-only-when-collapsed-navbar><button class=\"btn btn-default dropdown-toggle\" style=margin-left:10px type=button ng-click=goToNotifications()><i class=\"fa fa-bell\"></i></button></div><div class=\"hide-when-collapsed-navbar notifications\"><div ng-include src=\"'components/navbar/notifications.html'\"></div></div></li><li ng-show=isLoggedIn() ng-class=\"{active: isActive('/logout')}\"><a href=\"\" ng-click=logout()>Logout</a></li></ul></div></div></div>"
  );


  $templateCache.put('components/navbar/notifications.html',
    "<div class=dropdown style=margin-left:0px><button class=\"btn btn-default dropdown-toggle\" type=button id=dropdownMenu1 data-toggle=dropdown aria-haspopup=true aria-expanded=true><i class=\"fa fa-bell\"></i></button><ul class=\"notifications dropdown-menu\" style=position:absolute;right:0px role=menu aria-labelledby=dropdownMenu1><div class=notification-heading><h4 class=menu-title>Notifications</h4><a href=/notifications><h4 class=\"menu-title pull-right\">View all<i class=\"glyphicon glyphicon-circle-arrow-right\"></i></h4></a></div><li class=divider></li><div class=notifications-wrapper><a class=content href=# ng-repeat=\"item in notifications\"><div class=notification-item><h4 class=item-title>{{item.message}}</h4><p class=item-info am-time-ago=item.created></p></div></a></div><li class=divider></li><div class=notification-footer><a href=/notifications><h4 class=menu-title>View all<i class=\"glyphicon glyphicon-circle-arrow-right\"></i></h4></a></div></ul></div>"
  );


  $templateCache.put('components/typeahead/customTemplate.html',
    "<div class=typeahead-results><div ng-if=\"match && match.model.noresults\"><a href=/task/create>No results found for that would you like to make a <strong>new task for {{match.model.name}}?</strong></a></div><div ng-if=\"match && !match.model.noresults\"><a href=#><span bind-html-unsafe=\"match.label | typeaheadHighlight:query\"></span></a></div></div>"
  );

}]);

