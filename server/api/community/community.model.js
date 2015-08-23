'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CommunitySchema = new Schema({
  name:{ type: String },
  entryMethod:{ type: String, default:"email" }, // or area code
  entryParam:{type: String, default: ""}, //this can be suffix or area code
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

CommunitySchema.pre('save', function(next){
  this.updated = new Date();
  next();
});

// Validate length of email
CommunitySchema
  .path('name')
  .validate(function(name) {
    if ( name==undefined || name.length > 64) {
      return false;
    }
  }, 'Name too long. Limit 64 characters');

module.exports  = mongoose.model('Community', CommunitySchema);
