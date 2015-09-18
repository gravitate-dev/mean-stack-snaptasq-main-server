angular.module('snaptasqApp')
    .factory('Notify', function Notify($http, $resource, $q) {
        var Ntfy = $resource('/api/notify/:id/:controller', {
            id: '@_id'
        }, {
            get: {
                method: 'GET',
                isArray: true,
                params: {}
            },
            hideById: {
                method: 'POST',
                params: {
                    'controller': 'hideById'
                }
            },
        });
        return {

            /**
             * Authenticate user and save token
             *
             * @param  {Object}   user     - login info
             * @param  {Function} callback - optional
             * @return {Promise}
             */
            get: function(callback, category) {
                var cb = callback || angular.noop;
                var deferred = $q.defer();
                var query = {};
                if (!angular.isUndefined(category)) {
                    query.category = category;
                }
                Ntfy.get(query, {}, function(data) {
                    deferred.resolve(data);
                    return cb(data);
                });
                /*$http.get('/api/notify').
                success(function(data) {
                    deferred.resolve(data);
                    return cb(data);
                }).
                error(function(err) {
                    deferred.reject(err);
                    return cb(err);
                }.bind(this));*/

                return deferred.promise;
            },

            hideNotification: function(id, cb) {
                var cb = cb || angular.noop;
                Ntfy.hideById({
                    id: id
                }, {}, function(data) {
                    if (cb) {
                        return cb(data);
                    }
                });
            }
        };
    });
