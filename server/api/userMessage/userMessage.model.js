'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/environment');
var UserMessageSchema = new Schema({
    body: String,
    from: {
        id: Schema.Types.ObjectId,
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        },
        status: String, //read deleted sent
    },
    to: {
        id: Schema.Types.ObjectId,
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        },
        status: String, //read deleted sent
    },
    title: String,
    type: String, //normal friendRequest
    threadId: {
        type: String,
        index: true
    }, //threadID is to keep track of the back and forth
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

UserMessageSchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});

// Validate length of title
UserMessageSchema
    .path('title')
    .validate(function(d) {
        if (d == undefined || d.length > 128) {
            return false;
        }
    }, 'Title too long. Limit 128 characters');

// Validate length of body
UserMessageSchema
    .path('body')
    .validate(function(d) {
        if (d == undefined || d.length > 512) {
            return false;
        }
    }, 'Message too long. Limit 512 characters');

//exports.UserTask = mongoose.model('UserTask', taskSchemaForUser);
module.exports = mongoose.model('UserMessage', UserMessageSchema);
