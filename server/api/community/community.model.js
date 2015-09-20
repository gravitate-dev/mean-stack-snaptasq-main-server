'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uuid = require('uuid');
var config = require('../../config/environment');

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

var CommunitySchema = new Schema({
    name: String,
    users: [{
        id: {
            type: Schema.Types.ObjectId
        },
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar_group.png"
        }
    }],
    url: String,
    identifier: String,
    pic: String,
    description: String,
    source: {
        type: String,
        default: "snaptasq"
    }, // facebook,reddit,tumblr,twitter
    status: String, // public, private, closed, hidden, deleted
    isOpen: {
        type: Boolean,
        default: false
    },
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
