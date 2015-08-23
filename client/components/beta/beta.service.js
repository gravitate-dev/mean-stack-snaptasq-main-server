'use strict';

angular.module('snaptasqApp').factory('Beta', function Beta($resource, $http) {
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
});
