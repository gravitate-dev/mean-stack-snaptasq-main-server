'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/environment');

var UserMessageThreadSchema = new Schema({
    ownerIds: [{
        type: Schema.Types.ObjectId,
        index: true
    }],
    viewerIds: [{
        type: Schema.Types.ObjectId,
        index: true
    }], //if an owner deletes it from inbox it will remove them
    //this will change whenever a new message appears
    last: {
        id: Schema.Types.ObjectId,
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        },
        status: String, //read deleted sent
        body: String
    },
    title: String, //this is sent once
    type: String, //normal friendRequest
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    messages: [{
            id: Schema.Types.ObjectId,
            created: {
                type: Date,
                default: Date.now
            }
        }] // these are the ids to the messages that are in the thread
});
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
        type: Schema.Types.ObjectId,
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

UserMessageThreadSchema.pre('save', function(next) {
    this.updated = new Date();
    next();
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
module.exports = {
    Message: mongoose.model('UserMessage', UserMessageSchema),
    Thread: mongoose.model('UserMessageThread', UserMessageThreadSchema)
}
