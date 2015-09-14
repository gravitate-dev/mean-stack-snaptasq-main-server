'use strict';

var express = require('express');
var controller = require('./task.controller');
var auth = require('../../auth/auth.service');
var dsl = require('../../components/dsl');
var router = express.Router();

router.get('/', controller.index);
router.get('/me', auth.isAuthenticated(), dsl.processSearch, controller.getMyTasks); // dsl
router.get('/meResponsible', auth.isAuthenticated(), dsl.processSearch, controller.getTasksResponsible);
router.get('/meApplied', auth.isAuthenticated(), dsl.processSearch, controller.getMyAppliedTasks);
router.get('/meFriends', auth.isAuthenticated(), dsl.processSearch, controller.getMyFriendsTasks);

router.get('/countResponsible', auth.isAuthenticated(), dsl.processSearch, controller.countResponsibleTasks);

router.get('/friends/:id', dsl.processSearch, controller.getUsersTasksByUserId); //dsl
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/:id', auth.isAuthenticated(), controller.update);
router.post('/:id/apply', auth.isAuthenticated(), controller.applyToTask);
router.post('/:id/unapply', auth.isAuthenticated(), controller.unapplyToTask);
router.post('/:id/setTasker', auth.isAuthenticated(), controller.isTaskOwner, controller.setTasker);
router.post('/:id/startTask', auth.isAuthenticated(), controller.startTask);
router.post('/:id/finishTask', auth.isAuthenticated(), controller.finishTask);

router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
