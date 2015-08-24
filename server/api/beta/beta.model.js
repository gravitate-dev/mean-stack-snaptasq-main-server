'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BetaSchema = new Schema({
    name: String,
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
        default: "active"
    },
    uses: {
        type: Number,
        default: 0
    },
    maxUses: {
        type: Number,
        default: 100
    },
    usedByIp: [{
        type: String
    }]
});

// Validation
// Validate length of title less than or equal to 64 letters
BetaSchema
    .path('status')
    .validate(function(name) {
        if (name == "active" || name == "inactive")
            return true;
    }, 'Status must be active or inactive');

BetaSchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});
module.exports = mongoose.model('Beta', BetaSchema);
