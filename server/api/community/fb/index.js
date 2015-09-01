'use strict';
/* /api/communities */
var express = require('express');
var controller = require('./fb.community.controller');
var auth = require('../../../auth/auth.service');
var user = require('../../user/user.controller');


var router = express.Router();
router.post('/joinByUrl', auth.isAuthenticated(), user.getFbAccessToken, controller.processJoinUrl);

module.exports = router;
