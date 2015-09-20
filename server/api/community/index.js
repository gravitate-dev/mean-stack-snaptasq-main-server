 'use strict';
 /* /api/communities */
 var express = require('express');
 var controller = require('./community.controller');
 var auth = require('../../auth/auth.service');
 var user = require('../user/user.controller');
 var dsl = require('../../components/dsl');


 var router = express.Router();

 router.post('/', auth.hasRole('admin'), controller.create);
 router.get('/', auth.isAuthenticated(), controller.index);
 router.get('/:id/tasks', auth.isAuthenticated(), dsl.processSearch, controller.getTasks);
 //router.get('/me', auth.isAuthenticated(), controller.getMine);
 router.get('/:id', controller.show);
 router.get('/:id/amIMember', auth.isAuthenticated(), controller.amIMember); //auth.isAuthenticated() removed on purpose
 router.get('/:id/join/:encUserId', controller.join);
 router.post('/:id/requestJoin/snaptasq', auth.isAuthenticated(), controller.requestJoin);
 router.post('/:id/requestJoin/facebook', auth.isAuthenticated(), user.getFbAccessToken, controller.requestJoin);
 router.post('/:id/leaveGroup', auth.isAuthenticated(), controller.leaveGroup);
 router.post('/:id/addTask', auth.isAuthenticated(), controller.addTaskToCommunity);
 router.post('/search', controller.search);
 router.post('/friends', controller.getMyFriendsCommunities);
 router.delete('/:id', auth.hasRole('admin'), controller.destroy);

 //no need to use DSL
 router.get('/user/:id', auth.isAuthenticated(), controller.getCommunitiesByUser);

 module.exports = router;
