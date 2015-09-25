/* global io */
'use strict';
angular.module('snaptasqApp').factory('socket', function(socketFactory, $q, Auth, $interval) {
    // socket.io now auto-configures its connection when we ommit a connection url
    //io.connect({transports: ['websocket']});
    var socket = $q.defer();
    var promiseCompleted = false;

    function connectSocket() {
        Auth.isLoggedInAsync(function(isLoggedIn) {
            if (isLoggedIn) {
                var ioSocket = io({
                    // Send auth token on connection, you will need to DI the Auth service above
                    'query': 'token=' + Auth.getToken(),
                    transports: ['websocket'],
                    //path: '/socket.io-client' 
                    path: '/socket.io/socket.io.js'
                });
                var sock = socketFactory({
                    ioSocket: ioSocket
                });
                promiseCompleted = true;
                socket.resolve(sock);
            }
        });
    }

    connectSocket();


    var intervalId = $interval(function() {
        var currentUser = Auth.getCurrentUser();
        if (promiseCompleted || (!angular.isUndefined(currentUser) && !angular.isUndefined(currentUser._id))) {
            $interval.cancel(intervalId);
        } else {
            connectSocket();
        }

    }, 5000);
    return {
        socket: socket.promise,
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
            socket.promise.then(function(sock) {
                sock.on(modelName + ':save', function(item) {
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
            });
            /**
             * Syncs removed items on 'model:remove'
             */
            socket.promise.then(function(sock) {
                sock.on(modelName + ':remove', function(item) {
                    var event = 'deleted';
                    _.remove(array, {
                        _id: item._id
                    });
                    cb(event, item, array);
                });
            });
        },
        /**
         * Register listeners to sync an item with updates on a model
         *
         * Takes the destItem we want to sync, the model name that socket updates are sent from,
         * and an optional callback function after the item is updated.
         *
         * @param {String} modelName
         * @param {Object} destItem
         * @param {Function} cb
         */
        syncUpdateToId: function(modelName, id, cb) {
            cb = cb || angular.noop;
            /**
             * Syncs item creation/updates on 'model:save'
             */
            socket.promise.then(function(sock) {
                sock.on(modelName + ':' + id + ':save', function(item) {
                    cb(item);
                });
            });
            /**
             * Syncs removed items on 'model:remove'
             */
            /*socket.on(modelName + ':remove', function(item) {
                    cb(undefined);
                });
*/
        },
        unsyncUpdatesToId: function(modelName, id) {
            socket.promise.then(function(sock) {
                sock.removeAllListeners(modelName + ':' + id + ':save');
                sock.removeAllListeners(modelName + ':' + id + ':remove');
            });
        },
        /**
         * Removes listeners for a models updates on the socket
         *
         * @param modelName
         */
        unsyncUpdates: function(modelName) {
            socket.promise.then(function(sock) {
                sock.removeAllListeners(modelName + ':save');
                sock.removeAllListeners(modelName + ':remove');
            });
        }
    };
});
