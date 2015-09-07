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
router.post('/:id/reply', auth.isAuthenticated(), controller.replyToMessage);
router.delete('/:id', auth.isAuthenticated(), controller.deleteById);
module.exports = router;
