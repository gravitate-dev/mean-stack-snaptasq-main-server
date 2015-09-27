'use strict';

angular.module('snaptasqApp')
    .factory('Modal', function($rootScope, $modal) {
        /**
         * Opens a modal
         * @param  {Object} scope      - an object to be merged with modal's scope
         * @param  {String} modalClass - (optional) class(es) to be applied to the modal
         * @return {Object}            - the instance $modal.open() returns
         */
        var currentModal = undefined;

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
            currentModal = modal;

            return modal;
        }

        // Public API here
        return {
            closeCurrent: function() {
                if (currentModal != undefined && currentModal.dismiss != undefined) {
                    currentModal.dismiss();
                }

            },

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
                },

                /**
                 * Create a function to open a finishTask confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb  - callback, ran when start is confirmed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                finishTask: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a finishTask confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to cb callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            task = args.shift(),
                            myModal;

                        myModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Confirm Delete',
                                html: '<p>Do you want to mark this tasq for ' + task.ownerName + ' as completed?</p><p>If you would like to stop helping out for this tasq. Click on unapply to tasq instead.</p>',
                                buttons: [{
                                    classes: 'btn-success',
                                    text: 'Mark as completed',
                                    click: function(e) {
                                        myModal.close(e);
                                    }
                                }, {
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        myModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-success');

                        myModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
                /**
                 * Create a function to leave a community
                 * @param  {Function} cb  - callback, ran when start is confirmed
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                leaveGroup: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a leaveGroup confirmation modal
                     * @param  {String} name   - name or info to show on modal
                     * @param  {All}           - any additional args are passed staight to cb callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            community = args.shift(),
                            myModal;

                        myModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Leave the Group',
                                html: '<p>Do you want to leave ' + community.name + '?</p>',
                                buttons: [{
                                    classes: 'btn-success',
                                    text: 'Leave the group',
                                    click: function(e) {
                                        myModal.close(e);
                                    }
                                }, {
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        myModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-danger');

                        myModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                }
            },
            /* Signup modals */
            input: {

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
                },

                /**
                 * Create a function to open a phonenumber prompt (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when a valid phone number is entered
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                phoneNumberApplicant: function(cb) {
                    cb = cb || angular.noop;


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
                            phoneModal;

                        phoneModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Would you like text notification?',
                                htmlInclude: 'app/account/phoneNumber/modals/enterPhoneApplicant.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'No thank you',
                                    click: function(e) {
                                        phoneModal.close(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        phoneModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
                /**
                 * Create a function to open a phonenumber prompt (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when a valid phone number is entered
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                phoneNumberOwner: function(cb) {
                    cb = cb || angular.noop;


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
                            phoneModal;

                        phoneModal = openModal({
                            modal: {
                                dismissable: true,
                                title: 'Would you like text notification?',
                                htmlInclude: 'app/account/phoneNumber/modals/enterPhoneOwner.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'No thank you',
                                    click: function(e) {
                                        phoneModal.close(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        phoneModal.result.then(function(event) {
                            cb.apply(event, args);
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
                                htmlInclude: 'app/task/modals/applicants.modal.html',
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
                 * Create a function to open a task picker, it is currently used to pick a task to share to a community (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when the task is picked
                 * @param  {object}  group - the group to share too
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                pickMyTaskForCommunity: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a delete confirmation modal
                     * @param  {All}           - any additional args are passed staight to reg callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            community = args.shift(),
                            pickTaskModal;

                        pickTaskModal = openModal({
                            modal: {
                                community: community,
                                dismissable: true,
                                title: 'Pick Tasq',
                                htmlInclude: 'app/task/modals/picktask.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        pickTaskModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        pickTaskModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
                /**
                 * Create a function to open a share to community modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when the community is picked
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                shareToCommunity: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a delete confirmation modal
                     * @param  {String} task   - task to share
                     * @param  {All}           - any additional args are passed staight to reg callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            task = args.shift(),
                            shareCommunityModal;

                        shareCommunityModal = openModal({
                            modal: {
                                task: task,
                                dismissable: true,
                                title: 'Share Tasq To Community',
                                htmlInclude: 'app/communities/modals/share.community.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        shareCommunityModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        shareCommunityModal.result.then(function(event) {
                            cb.apply(event, args);
                        });
                    };
                },
                /**
                 * Create a function to open an invite friends to community modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
                 * @param  {Function} cb - callback, ran when the friend is invited
                 * @return {Function}     - the function to open the modal (ex. myModalFn)
                 */
                inviteFriendToCommunity: function(cb) {
                    cb = cb || angular.noop;

                    /**
                     * Open a friend invite to community modal
                     * @param  {String} group   - group you are inviting friend to
                     * @param  {All}           - any additional args are passed staight to reg callback
                     */
                    return function() {
                        var args = Array.prototype.slice.call(arguments),
                            group = args.shift(),
                            inviteFriendModal;

                        inviteFriendModal = openModal({
                            modal: {
                                group: group,
                                dismissable: true,
                                title: 'Share Tasq To Community',
                                htmlInclude: 'app/communities/modals/invitefriends.community.modal.html',
                                buttons: [{
                                    classes: 'btn-default',
                                    text: 'Cancel',
                                    click: function(e) {
                                        inviteFriendModal.dismiss(e);
                                    }
                                }]
                            }
                        }, 'modal-info');

                        inviteFriendModal.result.then(function(event) {
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
    });
