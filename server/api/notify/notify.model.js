'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NotifySchema = new Schema({
    messageOne: String, //messageOne is a message for the singled out id, which is determined by forOne
    message: String,
    pic: {
        type: String,
        default: 'assets/logos/snaptasq-64.png'
    },
    code: String, //this is msg type, its very specific like "task.applicant.task.completed"
    forOne: {
        type: Schema.Types.ObjectId,
        index: true
    },
    forMany: [Schema.Types.ObjectId],
    source: Schema.Types.ObjectId, //this is the source it comes from
    href: {
        type: String,
        default: '#'
    }, //# is default because it makes browser stay on the page
    category: {
        type: String,
        index: true
    }, //friend,community,taskOwner,taskApplicant
    created: {
        type: Date,
        default: Date.now,
        expireAfterSeconds: 2592000 //1 month before it expires
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

NotifySchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});

//exports.UserTask = mongoose.model('UserTask', taskSchemaForUser);
module.exports = mongoose.model('Notify', NotifySchema);
