'use strict';

var express = require('express');
var controller = require('./community.controller');
var auth = require('../../auth/auth.service');


var router = express.Router();

router.post('/', auth.hasRole('admin'), controller.create);
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/me', auth.isAuthenticated(), controller.getMine);
router.get('/:id', controller.show);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;