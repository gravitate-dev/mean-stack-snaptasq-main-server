'use strict';

var express = require('express');
var controller = require('./beta.controller');
var auth = require('../../auth/auth.service');
var recaptcha = require('../../config/recaptcha');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
//router.get('/:id', controller.show);
router.post('/', auth.hasRole('admin'),  controller.create);
//router.post('/:id/use', auth.isAuthenticated(),  controller.unapplyToTask);
//router.put('/:id', auth.hasRole('admin'), controller.update);
//router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.post('/:id/activate', auth.hasRole('admin'), controller.activate);
router.post('/:id/deactivate', auth.hasRole('admin'), controller.deactivate);
router.post('/:code/redeem', auth.isAuthenticated(), controller.redeem);
router.post('/addEmailBetaList', recaptcha.check, controller.addEmailBetaList);

module.exports = router;