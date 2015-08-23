'use strict';
var _ = require('lodash');
var Beta = require('./beta.model');
var User = require('../user/user.model');
// Get list of tasks
exports.index = function(req, res) {    
  Beta.find({},'-__v',function (err, betas) {
    if(err) { return handleError(res, err); }
    return res.json(200, betas);
  });

};

exports.isValidCode = function(req,res,next) {
  var betaCode = req.body.id;
  console.log("Checking beta code " + betaCode);
  Beta.findOne({"name":betaCode}, function (err, beta) {
    if (err) return handleError(res,err);
    if (!beta) return res.status(500).json({message: "This beta code has is no longer valid. Check your spelling."});
    if (beta.status!="active") return res.status(500).json({message: "This beta code has is no longer valid. It is set to inactive"});
    if (beta.maxUses<=beta.uses) return res.status(500).json({message: "This beta code is no longer valid. It has been used up by "+beta.maxUses+" people already."});
    return next(); //res.status(200).send("OK");
  });
}
exports.deactivate = function(req, res, next) {
  var betaId = req.params.id;

  Beta.findById(betaId, function (err, beta) {
    if (!beta) return res.status(500).json({message: "beta not found for id "+betaId});
      beta.status = "inactive";
      beta.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
  });
};

exports.activate = function(req, res, next) {
  var betaId = req.params.id;

  Beta.findById(betaId, function (err, beta) {
    if (!beta)res.status(500).json({message: "beta not found for id "+betaId});
      beta.status = "active";
      beta.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
  });
};


/**
 * Uses a beta code, if the usedByIp field detects multiple accounts
 * This will block them from registering
**/
exports.redeem = function(req, res, next) {
  var betaCode = req.body.id;
  //var ipAddress = req.ip;
  //console.log("Hello " + ipAddress);

  Beta.findOne({"name":betaCode}, function (err, beta) {
      if (!beta) return res.status(500).json({message: "beta not found for id "+betaCode});
      if (beta.status!= "active") return res.status(500).json({message: "Beta code is inactive really"});
      if (beta.maxUses<= beta.uses) return res.status(500).json({message: "Beta code has reached max uses. ("+beta.maxUses+" uses)"});
      /*
      // Commented out because it doesnt work!
      _.each(beta.usedByIp,function(item){
        if (item==ipAddress){
          console.log("u used the coad already");
          return res.status(500).json({message: "This code is used by you already. Try a different device."});
        }
      });
      beta.usedByIp.push(ipAddress);
      */
      beta.uses+=1;
      beta.save(function(err) {
        if (err) return validationError(res, err);
        return res.status(200).json({message: "Success, welcome to the beta."});
      });
        
  });
};

// Creates a beta task, requires admin
exports.create = function(req, res) {
    var newBeta = new Beta(req.body);
    if (newBeta.maxUses > 100){
        return res.status(500).json({message:"maxUses can have a max of 100"});
    }
    var currentUserId = req.session.userId;
    if (currentUserId == 0 || !currentUserId) {
        return res.status(500).json({
            message: "Please relogin first"
        });
    }
    Beta.create(newBeta, function(err, beta) {
        if (err) {return handleError(res, err);}
        return res.json(201, beta);
    });
}

// Deletes a beta from the DB.
exports.destroy = function(req, res) {
    Beta.findByIdAndRemove(req.params.id, function(err, user) {
        if(err) return res.send(500, err);
        return res.send(204);
    });
};


exports.addEmailBetaList = function(req,res){
  var email = req.param('email');
  if (email == undefined) return res.status(500).json({message: "Missing email address"});
  

  return res.status(200).json({"message":"Added your email to the list"});

}

function handleError(res, err) {
    return res.send(500, err);
}