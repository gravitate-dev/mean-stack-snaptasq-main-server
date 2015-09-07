'use strict'
/* I put broken nomods here which are included before the app.js
its sad but this is the only fix i know for now
*/

angular.module("ngAutocomplete", [])
    .directive('ngAutocomplete', function() {
        return {
            require: 'ngModel',
            scope: {
                ngModel: '=',
                options: '=?',
                details: '=?'
            },

            link: function(scope, element, attrs, controller) {

                //options for autocomplete
                var opts
                var watchEnter = false
                    //convert options provided to opts
                var initOpts = function() {

                    opts = {}
                    if (scope.options) {

                        if (scope.options.watchEnter !== true) {
                            watchEnter = false
                        } else {
                            watchEnter = true
                        }

                        if (scope.options.types) {
                            opts.types = []
                            opts.types.push(scope.options.types)
                            scope.gPlace.setTypes(opts.types)
                        } else {
                            scope.gPlace.setTypes([])
                        }

                        if (scope.options.bounds) {
                            opts.bounds = scope.options.bounds
                            scope.gPlace.setBounds(opts.bounds)
                        } else {
                            scope.gPlace.setBounds(null)
                        }

                        if (scope.options.country) {
                            opts.componentRestrictions = {
                                country: scope.options.country
                            }
                            scope.gPlace.setComponentRestrictions(opts.componentRestrictions)
                        } else {
                            scope.gPlace.setComponentRestrictions(null)
                        }
                    }
                }

                if (scope.gPlace == undefined) {
                    scope.gPlace = new google.maps.places.Autocomplete(element[0], {});
                }
                google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
                    var result = scope.gPlace.getPlace();
                    if (result !== undefined) {
                        if (result.address_components !== undefined) {

                            scope.$apply(function() {

                                scope.details = result;

                                controller.$setViewValue(element.val());
                            });
                        } else {
                            if (watchEnter) {
                                getPlace(result)
                            }
                        }
                    }
                })

                //function to get retrieve the autocompletes first result using the AutocompleteService 
                var getPlace = function(result) {
                    var autocompleteService = new google.maps.places.AutocompleteService();
                    if (result.name.length > 0) {
                        autocompleteService.getPlacePredictions({
                                input: result.name,
                                offset: result.name.length
                            },
                            function listentoresult(list, status) {
                                if (list == null || list.length == 0) {

                                    scope.$apply(function() {
                                        scope.details = null;
                                    });

                                } else {
                                    var placesService = new google.maps.places.PlacesService(element[0]);
                                    placesService.getDetails({
                                            'reference': list[0].reference
                                        },
                                        function detailsresult(detailsResult, placesServiceStatus) {

                                            if (placesServiceStatus == google.maps.GeocoderStatus.OK) {
                                                scope.$apply(function() {

                                                    controller.$setViewValue(detailsResult.formatted_address);
                                                    element.val(detailsResult.formatted_address);

                                                    scope.details = detailsResult;

                                                    //on focusout the value reverts, need to set it again.
                                                    var watchFocusOut = element.on('focusout', function(event) {
                                                        element.val(detailsResult.formatted_address);
                                                        element.unbind('focusout')
                                                    })

                                                });
                                            }
                                        }
                                    );
                                }
                            });
                    }
                }

                controller.$render = function() {
                    var location = controller.$viewValue;
                    element.val(location);
                };

                //watch options provided to directive
                scope.watchOptions = function() {
                    return scope.options
                };
                scope.$watch(scope.watchOptions, function() {
                    initOpts()
                }, true);

            }
        };
    });

(function(root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(root, require('angular'));
    } else if (typeof define === 'function' && define.amd) {
        define(['angular'], function(angular) {
            return (root.ngNotificationsBar = factory(root, angular));
        });
    } else {
        root.ngNotificationsBar = factory(root, root.angular);
    }
}(this, function(window, angular) {
    var module = angular.module('ngNotificationsBar', []);

    module.provider('notificationsConfig', function() {
        var config = {};

        function setHideDelay(value) {
            config.hideDelay = value;
        }

        function getHideDelay() {
            return config.hideDelay;
        }

        function setAcceptHTML(value) {
            config.acceptHTML = value;
        }

        function getAcceptHTML() {
            return config.acceptHTML;
        }


        function setAutoHide(value) {
            config.autoHide = value;
        }

        function getAutoHide() {
            return config.autoHide;
        }

        return {
            setHideDelay: setHideDelay,

            setAutoHide: setAutoHide,

            setAcceptHTML: setAcceptHTML,

            $get: function() {
                return {
                    getHideDelay: getHideDelay,

                    getAutoHide: getAutoHide,

                    getAcceptHTML: getAcceptHTML
                };
            }
        };
    });

    module.factory('notifications', ['$rootScope', function($rootScope) {
        var showError = function(message) {
            $rootScope.$broadcast('notifications:error', message);
        };

        var showWarning = function(message) {
            $rootScope.$broadcast('notifications:warning', message);
        };

        var showSuccess = function(message) {
            $rootScope.$broadcast('notifications:success', message);
        };

        var closeAll = function() {
            $rootScope.$broadcast('notifications:closeAll');
        };

        return {
            showError: showError,
            showWarning: showWarning,
            showSuccess: showSuccess,
            closeAll: closeAll
        };
    }]);

    module.directive('notificationsBar', ['notificationsConfig', '$timeout', function(notificationsConfig, $timeout) {
        return {
            restrict: 'EA',
            template: function(elem, attr) {
                var acceptHTML = notificationsConfig.getAcceptHTML() || false;
                var iconClasses = attr.closeicon || 'glyphicon glyphicon-remove';
                return acceptHTML ? '\
                    <div class="notifications-container" ng-if="notifications.length">\
                        <div class="{{note.type}}" ng-repeat="note in notifications">\
                            <span class="message" ng-bind-html="note.message"></span>\
                            <span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
                        </div>\
                    </div>\
                ' : '\
                    <div class="notifications-container" ng-if="notifications.length">\
                        <div class="{{note.type}}" ng-repeat="note in notifications">\
                            <span class="message" >{{note.message}}</span>\
                            <span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
                        </div>\
                    </div>\
                '

            },
            link: function(scope) {
                var notifications = scope.notifications = [];
                var timers = [];
                var autoHideDelay = notificationsConfig.getHideDelay() || 3000;
                var autoHide = notificationsConfig.getAutoHide() || false;

                var removeById = function(id) {
                    var found = -1;

                    notifications.forEach(function(el, index) {
                        if (el.id === id) {
                            found = index;
                        }
                    });

                    if (found >= 0) {
                        notifications.splice(found, 1);
                    }
                };

                var notificationHandler = function(event, data, type) {
                    var message, hide = autoHide,
                        hideDelay = autoHideDelay;

                    if (typeof data === 'object') {
                        message = data.message;
                        hide = (typeof data.hide === 'undefined') ? autoHide : !!data.hide;
                        hideDelay = data.hideDelay || hideDelay;
                    } else {
                        message = data;
                    }

                    var id = 'notif_' + (new Date()).getTime();
                    notifications.push({
                        id: id,
                        type: type,
                        message: message
                    });
                    if (hide) {
                        var timer = $timeout(function() {
                            removeById(id);
                            $timeout.cancel(timer);
                        }, hideDelay);
                    }
                };

                scope.$on('notifications:error', function(event, data) {
                    notificationHandler(event, data, 'error');
                });

                scope.$on('notifications:warning', function(event, data) {
                    notificationHandler(event, data, 'warning');
                });

                scope.$on('notifications:success', function(event, data) {
                    notificationHandler(event, data, 'success');
                });

                scope.$on('notifications:closeAll', function() {
                    notifications.length = 0;
                })

                scope.close = function(index) {
                    notifications.splice(index, 1);
                };
            }
        };
    }]);

    return module;
}));
