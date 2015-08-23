'use strict';

describe('Controller: TermsCtrl', function() {

    // load the controller's module
    beforeEach(module('snaptasqApp'));
    beforeEach(module('socketMock'));

    var TermsCtrl,
        scope,
        $httpBackend;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(_$httpBackend_, $controller, $rootScope) {
        $httpBackend = _$httpBackend_;

        scope = $rootScope.$new();
        TermsCtrl = $controller('TermsCtrl', {
            $scope: scope
        });
    }));

    it('should attach a list of things to the scope', function() {
        $httpBackend.flush();
        expect(1).toBe(1);
    });
});
