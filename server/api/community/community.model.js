'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uuid = require('uuid');
var config = require('../../config/environment');
var CommunitySchema = new Schema({
    name: String,
    users: [{
        id: {
            type: Schema.Types.ObjectId,
            index: true
        },
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        }
    }],
    tasks: [{
        id: {
            type: Schema.Types.ObjectId,
            index: true
        },
        name: String,
    }],
    url: String,
    identifier: String,
    source: {
        type: String,
        default: "snaptasq"
    }, // facebook,reddit,tumblr,twitter
    status: String, // public, private, closed, hidden, deleted
    challenges: [ChallengeSchema],
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

var ChallengeSchema = new Schema({
    id: {
        type: String,
        default: function() {
            return uuid.v4()
        }
    },
    type: {
        type: String,
        default: "open"
    }, // open,email,areacode,code, fburl, fburl requires a url to be inputted
    answers: [{
        type: String,
        default: ""
    }], //this can be suffix or area code
    prompt: { //this is optional
        type: String
    },
});

CommunitySchema.pre('save', function(next) {
    if (this.isNew) {
        this.id = uuid.v4();
    }
    this.updated = new Date();
    next();
});

// Validate length of email
CommunitySchema
    .path('name')
    .validate(function(name) {
        if (name == undefined || name.length > 64) {
            return false;
        }
    }, 'Name too long. Limit 64 characters');

module.exports = mongoose.model('Community', CommunitySchema);
