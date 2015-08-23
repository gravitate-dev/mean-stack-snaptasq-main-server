/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {
  // Insert routes below
  app.use('/api/tasks', require('./api/task'));
  app.use('/api/emails', require('./api/email'));
  //app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/beta', require('./api/beta'));
  app.use('/api/notify',require('./api/notify'));
  app.use('/api/communities',require('./api/community'));
  

  app.use('/auth', require('./auth'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
