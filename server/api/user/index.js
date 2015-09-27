'use strict';


//TODO: a user can hold a friend request forever, make the friend request expire???? maybe that creates more issues....
var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var recaptcha = require('../../config/recaptcha');
var beta = require('../beta/beta.controller');
var task = require('../task/task.controller');


var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/me/permission', controller.hasFbPermission);
router.post('/search', controller.search);
//TODO: check to see if this is secure
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.post('/sendVerificationEmail', auth.isAuthenticated(), recaptcha.check, controller.sendVerificationEmail)
router.post('/sendVerificationText', auth.isAuthenticated(), controller.sendVerificationText);
router.post('/verify/phoneNumber', auth.isAuthenticated(), controller.redeemPhoneVerifyCode);
router.post('/sendForgotPasswordEmail', recaptcha.check, controller.sendForgotPasswordEmail)
router.get('/verify/email/:code', controller.verifyEmailCompleted);
router.put('/resetChangePassword', controller.resetChangePassword);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/set', auth.isAuthenticated(), controller.setField);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', recaptcha.check, controller.create);
router.post('/applyBetaCode', auth.isAuthenticated(), beta.isValidCode, controller.applyBetaCode, beta.redeem);
router.post('/:id/requestFriendship', auth.isAuthenticated(), controller.requestFriendship);
router.post('/:id/removeFriendship', auth.isAuthenticated(), controller.removeFriendship);
router.delete('/:id/deleteMyAccount', auth.isAuthenticated(), controller.deleteMyAccount);


module.exports = router;
