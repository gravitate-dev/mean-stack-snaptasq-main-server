'use strict';

angular.module('snaptasqApp')
    .factory('Notify', function Notify($http, $q) {
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
    });
