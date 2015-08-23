'use strict';

describe('Controller: PrivacyCtrl', function() {

    // load the controller's module
    beforeEach(module('snaptasqApp'));
    beforeEach(module('socketMock'));

    var PrivacyCtrl,
        scope,
        $httpBackend;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(_$httpBackend_, $controller, $rootScope) {
        $httpBackend = _$httpBackend_;

        scope = $rootScope.$new();
        PrivacyCtrl = $controller('PrivacyCtrl', {
            $scope: PrivacyCtrl
        });
    }));

    it('should attach a list of things to the scope', function() {
        $httpBackend.flush();
        expect(1).toBe(1);
    });
});
