'use strict';

angular.module('snaptasqApp')
    .factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore, $q) {
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
            },

            isUserInGroup: function(groupId, cb) {
                for (var i = 0; i < currentUser.communityMemberships.length; i++) {
                    if (currentUser.communityMemberships[i] == groupId)
                        return cb(true);
                }
                return cb(false);
            },
            isUserInGroupAsync: function(groupId, cb) {
                var that = this;
                if (currentUser.hasOwnProperty('$promise')) {
                    currentUser.$promise.then(function() {
                        return that.isUserInGroup(groupId, cb);
                    }).catch(function() {
                        return cb(false);
                    });
                } else {
                    return that.isUserInGroup(groupId, cb);
                }
            }
        };
    });
