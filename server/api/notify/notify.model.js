'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NotifySchema = new Schema({
    message: String,
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
        default: Date.now
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
