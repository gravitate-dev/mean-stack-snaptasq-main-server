'use strict';
angular.module('snaptasqApp')
    .controller('PricePointsModalCtrl', function($scope, Modal) {

    })
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
    .filter('pricePointCategory', function(pricePointService) {
        return function(amount, scope) {
            return pricePointService.asStr(amount);
        }
    });
