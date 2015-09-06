'use strict';

var express = require('express');
var controller = require('./task.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.get('/me', auth.isAuthenticated(), controller.getMyTasks);
router.get('/meResponsible', auth.isAuthenticated(), controller.getTasksResponsible);
router.get('/meApplied', auth.isAuthenticated(), controller.getMyAppliedTasks);
router.get('/meFriends', auth.isAuthenticated(), controller.getMyFriendsTasks);

router.get('/countResponsible', auth.isAuthenticated(), controller.countResponsibleTasks);

router.get('/friends/:id', controller.getFriendsTasks);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/:id', auth.isAuthenticated(), controller.update);
router.post('/:id/apply', auth.isAuthenticated(), controller.applyToTask);
router.post('/:id/unapply', auth.isAuthenticated(), controller.unapplyToTask);
router.post('/:id/setTasker', auth.isAuthenticated(), controller.isTaskOwner, controller.setTasker);
router.post('/:id/confirmTasker', auth.isAuthenticated(), controller.confirmTasker);

router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
