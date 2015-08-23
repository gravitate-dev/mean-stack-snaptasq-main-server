/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /communities              ->  index
 * POST    /communities              ->  create
 * GET     /communities/:id          ->  show
 * PUT     /communities/:id          ->  update
 * DELETE  /communities/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Community = require('./community.model');

// Get list of communities
exports.index = function(req, res) {
  Community.find({},'', function (err, comms) {
    if(err) { return handleError(res, err); }
    return res.json(200, comms);
  });
};

exports.getMine = function(req, res) {
  Community.find({},'-salt -hashedPassword -verification.code -forgotPassCode -throttle',function (err, comms) {
    if(err) { return handleError(res, err); }
    return res.json(200, comms);
  });
};
// Get a single comm
exports.show = function(req, res) {
  Community.findById(req.params.id, function (err, comm) {
    if(err) { return handleError(res, err); }
    if(!comm) { return res.send(404); }
    return res.json(comm);
  });
};

// Creates a new community in the DB.
// @require admin
exports.create = function(req, res) {
  Community.create(req.body, function(err, comm) {
    if(err) { return handleError(res, err); }
    return res.json(201, comm);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Community.findById(req.params.id, function (err, comm) {
    if (err) { return handleError(res, err); }
    if(!comm) { return res.send(404); }
    var updated = _.merge(comm, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, comm);
    });
  });
};

// Deletes a comm from the DB.
exports.destroy = function(req, res) {
  Community.findById(req.params.id, function (err, comm) {
    if(err) { return handleError(res, err); }
    if(!comm) { return res.send(404); }
    comm.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}