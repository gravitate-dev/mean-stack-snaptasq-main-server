'use strict';

angular.module('snaptasqApp')
    .factory('Modal', function($rootScope, $modal) {
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
    });
