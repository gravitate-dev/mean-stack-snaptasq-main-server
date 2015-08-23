/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Thing = require('../api/thing/thing.model');
var User = require('../api/user/user.model');
var Task = require('../api/task/task.model');
var Beta = require('../api/beta/beta.model');

Thing.find({}).remove(function() {
  Thing.create({
    name : 'Development Tools',
    info : 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
  }, {
    name : 'Server and Client integration',
    info : 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
  }, {
    name : 'Smart Build System',
    info : 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
  },  {
    name : 'Modular Structure',
    info : 'Best practice client and server structures allow for more code reusability and maximum scalability'
  },  {
    name : 'Optimized Build',
    info : 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
  },{
    name : 'Deployment Ready',
    info : 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
  });
});


Beta.find({}).remove(function() {
Beta.create(
  {maxUses:1,name:"SNAPTEST"},
  {maxUses:99,name:"wawa"}
  );
});

Task.find({}).remove();
User.find({}).remove(function() {
  User.create({
    provider: 'local',
    name: 'Test User',
    email: 'test@test.com',
    password: 'test',
    verification: {status:true}
  }, {
    provider: 'local',
    name: 'Friends User A',
    email: 'frienda@test.com',
    password: 'test',
    verification: {status:true}
  },
  {
    provider: 'local',
    name: 'Friends User B',
    email: 'friendb@test.com',
    password: 'test',
    verification: {status:true}
  }, {
    provider: 'local',
    role: 'admin',
    name: 'Admin',
    email: 'admin@snaptasq.com',
    password: 'wawa',
    verification: {status:true},
  }, function() {
      //after adding the users we need to friend them!

      console.log('finished populating users');
    }
  );
});