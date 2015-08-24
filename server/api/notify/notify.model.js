'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NotifySchema = new Schema({
    message: String,
    to: Schema.Types.ObjectId, //this is the input box they can use to set their username customly when they signup
    link: {
        type: String,
        default: '#'
    }, //# is default because it makes browser stay on the page
    codeId: {
        type: Number
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    seen: {
        type: Boolean,
        default: false
    }
});

NotifySchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});

//exports.UserTask = mongoose.model('UserTask', taskSchemaForUser);
module.exports = mongoose.model('Notify', NotifySchema);
