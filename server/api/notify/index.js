'use strict';
var express = require('express');
var controller = require('./notify.controller');
var config = require('../../config/environment');

var router = express.Router();

/* Gets my Notifications, this week */
router.get('/', controller.getMyNotifications);
module.exports = router;
