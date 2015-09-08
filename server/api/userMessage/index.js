'use strict';
var express = require('express');
var controller = require('./userMessage.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

/* Gets my Messages, this week */
router.get('/getPrimary', controller.getMyMessagesPrimary);
router.get('/getFriends', controller.getMyMessagesFriendRequests);
router.post('/', auth.isAuthenticated(), controller.create);
router.get('/:id', auth.isAuthenticated(), controller.getMessageById);
router.get('/:id/thread', auth.isAuthenticated(), controller.doesUserOwnAndSeeMessageThread, controller.getMessagesByThreadId);
router.post('/:id/thread/reply', auth.isAuthenticated(), controller.doesUserOwnAndSeeMessageThread, controller.replyToThread);
router.post('/:id/reply', auth.isAuthenticated(), controller.replyToMessage);
router.post('/newMessage', auth.isAuthenticated(), controller.create);
router.delete('/:id', auth.isAuthenticated(), controller.deleteById);
module.exports = router;
