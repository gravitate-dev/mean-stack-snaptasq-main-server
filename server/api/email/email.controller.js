'use strict';

var _ = require('lodash');
var Email = require('./email.model');
var config = require('../../config/environment');
var sendgrid  = require('sendgrid')(config.sendGridApiKey);

exports.sendRequestTaskerHelp = function( req, res, emailaddress, tasklink, tasktitle, taskownername, taskownerimage){
  var email = new sendgrid.Email();
  email.addTo(emailaddress);
  var helpText = taskownername+" chose you to help with " + tasktitle;
  email.subject = helpText;
  email.from = 'admin@snaptasq.com';
  email.html = helpText;
  // add filter settings one at a time 
  email.addFilter('templates', 'enable', 1);
  email.addFilter('templates', 'template_id', 'a635c71c-40d6-4845-b2b8-6029f5a13135');
  email.addSubstitution('-tasklink-', tasklink);
  email.addSubstitution('-tasktitle-', tasktitle);
  email.addSubstitution('-taskownername-', taskownername);
  email.addSubstitution('-taskownerimage-', taskownerimage);

  sendgrid.send(email, function(err, json) {
  if (err) { 
    if (res!=null)
      res.status(500).json(err);
  } else {
    if (res!=null)      
      res.status(200).send("sent email");
  }
  });
}
/*
 * Send out a verification email
 * NOTE this is not exported by a route and is on purpose. this is called from
 * User.model.js
*/
exports.resendVerification = function( req, res, emailaddress, code ){
if (config.dontRequireEmailVerification){
  return res.status(200).json({ status:"success", message: "Debug: email verification is not needed"});
}
var email = new sendgrid.Email();
email.addTo(emailaddress);
email.subject = "Please Verify Your Email Address";
email.from = 'admin@snaptasq.com';
email.html = '<a href="'+config.host.url+'api/users/verify/'+code+'">'+config.host.url+'api/users/verify/'+code+'</a>';
// add filter settings one at a time 
email.addFilter('templates', 'enable', 1);
email.addFilter('templates', 'template_id', 'f28918ba-475d-4f32-8269-6983ee424362');
email.addSubstitution('-email-', emailaddress);

sendgrid.send(email, function(err, json) {
  if (err) { 
    res.status(500).json({ status:"error", message: 'Our Verification Email System is currently down :-(. Please try resending an email in your <a href="/settings"><i class="fa fa-cog"></i>&nbsp;settings page</a>' })
  } else {
    res.status(200).json({ status:"success", message: 'Email has been sent to '+emailaddress })
  }
});
}

/*
 * Send out a verification email
 * NOTE this is not exported by a route and is on purpose. this is called from
 * User.model.js
 * code1 is the forgotCode
 * code2 is the sha1 of code1
*/
exports.sendForgotPasswordEmail = function( req, res, emailaddress, code1, code2 ){
var email = new sendgrid.Email();
email.addTo(emailaddress);
email.subject = "Reset Your Password";
email.from = 'admin@snaptasq.com';
email.html = '<a href="'+config.host.url+'resetPassword/'+code1+'/'+code2+'">'+config.host.url+'resetPassword/'+code1+'/'+code2+'</a>';
// add filter settings one at a time 
email.addFilter('templates', 'enable', 1);
email.addFilter('templates', 'template_id', '0f601f82-f288-4b5b-a0f3-1cbb01bc5b9a');
email.addSubstitution('-email-', emailaddress);

sendgrid.send(email, function(err, json) {
  if (err) { 
    res.status(500).json({ status:"error", message: 'Our Email System is currently down :-(. Please try again later.' })
  } else {
    res.status(200).json({ status:"success", message: 'Check your inbox! We sent you a reset password email to '+emailaddress })
  }
});
}

/*
 * Send out the new password email to them to use
 * NOTE this is not exported by a route and is on purpose. this is called from
 * User.model.js
*/
/*exports.sendNewPasswordEmail = function( req, res, emailaddress, newpass ){
var email = new sendgrid.Email();
email.addTo(emailaddress);
email.subject = "Your New Password";
email.from = 'admin@snaptasq.com';
email.html = 'Your new password: <strong>'+newpass+'</strong>';
// add filter settings one at a time 
email.addFilter('templates', 'enable', 1);
email.addFilter('templates', 'template_id', '9f8e4341-a8f9-4217-ac15-f769ceea1532');
email.addSubstitution('-email-', emailaddress);

sendgrid.send(email, function(err, json) {
  if (err) { 
    res.status(500).json({ status:"error", message: 'Our Email System is currently down :-(. Please try again later.' })
  } else {
    res.status(200).json({ status:"success", message: 'Check your inbox! We sent you your new password to '+emailaddress })
  }
});
}*/





exports.resendVerificationSilent = function( emailaddress, code ){
if (config.dontRequireEmailVerification){
  return 1;
}
var email = new sendgrid.Email();
email.addTo(emailaddress);
email.subject = "Please Verify Your Email Address";
email.from = 'admin@snaptasq.com';
email.html = '<a href="'+config.host.url+'api/users/verify/'+code+'">'+config.host.url+'api/users/verify/'+code+'</a>';
// add filter settings one at a time 
email.addFilter('templates', 'enable', 1);
email.addFilter('templates', 'template_id', 'f28918ba-475d-4f32-8269-6983ee424362');
email.addSubstitution('-email-', emailaddress);

sendgrid.send(email, function(err, json) {
  if (err) { 
    return 1;
  } else {
    return 0;
  }
});
}

/*
// Get list of emails
exports.index = function(req, res) {
  Email.find(function (err, emails) {
    if(err) { return handleError(res, err); }
    return res.json(200, emails);
  });
};

// Get a single email
exports.show = function(req, res) {
  Email.findById(req.params.id, function (err, email) {
    if(err) { return handleError(res, err); }
    if(!email) { return res.send(404); }
    return res.json(email);
  });
};

// Creates a new email in the DB.
exports.create = function(req, res) {
  Email.create(req.body, function(err, email) {
    if(err) { return handleError(res, err); }
    return res.json(201, email);
  });
};

// Updates an existing email in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Email.findById(req.params.id, function (err, email) {
    if (err) { return handleError(res, err); }
    if(!email) { return res.send(404); }
    var updated = _.merge(email, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, email);
    });
  });
};

// Deletes a email from the DB.
exports.destroy = function(req, res) {
  Email.findById(req.params.id, function (err, email) {
    if(err) { return handleError(res, err); }
    if(!email) { return res.send(404); }
    email.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};
*/

exports.addEmailToList = function(email,list){

};
function handleError(res, err) {
  return res.send(500, err);
}

exports.testSendEmail = function(req,res){
  var userImage = "assets/logos/no_avatar.gif"
  var taskOwnerName = "Billy Bob";
  exports.sendRequestTaskerHelp(req,res, "robertirribarren@gmail.com", "www.google.com", "Help with the walrus", taskOwnerName, userImage)
}