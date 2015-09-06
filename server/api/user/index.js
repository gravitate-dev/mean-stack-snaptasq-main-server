'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var recaptcha = require('../../config/recaptcha');
var beta = require('../beta/beta.controller');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/me/permission', controller.hasFbPermission);
router.post('/search', controller.search);
//TODO: check to see if this is secure
router.delete('/:id/deleteMyAccount', auth.isAuthenticated(), controller.deleteMyAccount);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.post('/:id/sendVerificationEmail', auth.isAuthenticated(), recaptcha.check, controller.sendVerificationEmail)
router.post('/sendForgotPasswordEmail', recaptcha.check, controller.sendForgotPasswordEmail)
router.get('/verify/:code', controller.verifyEmailCompleted)
router.put('/resetChangePassword', controller.resetChangePassword);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', recaptcha.check, controller.create);
router.post('/applyBetaCode', auth.isAuthenticated(), beta.isValidCode, controller.applyBetaCode, beta.redeem);




module.exports = router;
