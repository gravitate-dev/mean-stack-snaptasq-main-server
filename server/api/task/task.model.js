'use strict';
var config = require('../../config/environment');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/*
 * the task.status enum
 * open, when a task has not chosen an applicant
 * approved, when a task has chosen an applicant, and the tasker has accepted
 * completed, when a task has been finished, only set by the owner, also marked after 90 days of inactivity
 * deleted, when a task has been deleted by an admin or the owner.
 */
var TaskSchema = new Schema({
    name: String,
    ownerId: Schema.Types.ObjectId,
    ownerName: String,
    ownerPic: String,
    description: String,
    tasker: {
        id: Schema.Types.ObjectId,
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        },
        fbId: String,
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "open"
    },
    payout: {
        type: Number,
        default: 0
    },
    communitiesIn: [{
        id: {
            type: Schema.Types.ObjectId,
            index: true
        },
        name: String,
    }],
    applicants: [{
        id: Schema.Types.ObjectId,
        name: String,
        pic: {
            type: String,
            default: config.host.url + "assets/logos/no_avatar.gif"
        },
        fbId: String
    }],
    location: {
        name: String,
        formattedName: String,
        geo: {
            center: {
                latitude: Number,
                longitude: Number
            },
            hash: String,
        },
        sname: String,
        place_id: String,
        url: String,
        vicinity: String
    }
});
// Validation
// Validate length of title less than or equal to 64 letters
TaskSchema
    .path('name')
    .validate(function(name) {
        if (name.length > 128) {
            return false;
        }
        if (name.indexOf('admin') !== -1) return false;
        var reg = /[^A-Za-z0-9 ]/;
        if (reg.test(name)) //test for not matching
            return false;
    }, 'Title too long or uses invalid characters. Limit 64 characters');


TaskSchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});

//TaskSchema.plugin(autoIncrement.plugin, 'Task');
module.exports = mongoose.model('Task', TaskSchema);
