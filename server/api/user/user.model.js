'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['facebook'];
var config = require('../../config/environment');
var UserSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    accountName: String, //this is the input box they can use to set their username customly when they signup
    email: {
        type: String,
        lowercase: true
    },
    pic: {
        type: String,
        default: config.host.url + "assets/logos/no_avatar.gif"
    },
    isConnectedWithFb: {
        type: Boolean,
        default: false
    },
    hasConnectedWithFbOnce: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    fb: {
        id: String,
        accessToken: String,
        refreshToken: String,
        gender: String,
        email: String,
        username: String,
        friendCountAdded: {
            type: Number,
            default: 0
        },
        //permissions:[String],
        json: {}
    },
    verification: {
        status: {
            type: Boolean,
            default: false
        },
        code: String
    },
    forgotPassCode: {
        type: String
    }, //uuid
    role: {
        type: String,
        default: 'user'
    },
    myTasks: [Schema.Types.ObjectId],
    otherTasks: [Schema.Types.ObjectId],
    groups: [{
        id: Schema.Types.ObjectId,
        name: String,
        pic: String,
        source: String
    }],
    friends: [friendSchema],
    hashedPassword: String,
    provider: String,
    salt: String,
    requiresBeta: {
        type: Boolean,
        default: false
    }
});


var friendSchema = new Schema({
    id: Schema.Types.ObjectId,
    name: String,
    pic: {
        type: String,
        default: "assets/logos/no_avatar.gif"
    },
    externalId: String, //this is like their fbID
    source: {
        type: String,
        default: "snaptasq"
    } //soource is where you got the friend, it can be facebook, snaptasq, twitter, etc
});
/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

// Public profile information
UserSchema
    .virtual('profile')
    .get(function() {
        return {
            'name': this.name,
            'role': this.role
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function() {
        return {
            '_id': this._id,
            'role': this.role
        };
    });

/**
 * Validations
 */

// Validate empty email
UserSchema
    .path('email')
    .validate(function(email) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return email.length;
    }, 'Email cannot be blank');

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function(hashedPassword) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return hashedPassword.length;
    }, 'Password cannot be blank');

// Validate length of name
UserSchema
    .path('name')
    .validate(function(name) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        if (this.provider == "local" && (name == undefined || name.length > 20)) {
            return false;
        }
        if (name.indexOf('admin') !== -1) return false;
    }, 'Username too long. Limit 20 characters');

// Validate length of email
UserSchema
    .path('email')
    .validate(function(name) {
        if (name == undefined || name.length > 128) {
            return false;
        }
    }, 'Email too long. Limit 128 characters');

// Validate length of accountName
UserSchema
    .path('accountName')
    .validate(function(name) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        if (this.provider == "local" && (name == undefined || name.length > 20)) {
            return false;
        }
        if (name.indexOf('admin') !== -1) return false;
    }, 'Username too long. Limit 20 characters');

// Validate email is not taken
UserSchema
    .path('email')
    .validate(function(value, respond) {
        var self = this;
        this.constructor.findOne({
            email: value
        }, function(err, user) {
            if (err) throw err;
            if (user) {
                if (self.id === user.id) return respond(true);
                return respond(false);
            }
            respond(true);
        });
    }, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function(next) {
        if (!this.isNew) return next();

        if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
            next(new Error('Invalid password'));
        else
            next();
    });

/**
 * Methods
 */
UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
};

UserSchema.static('findByVerificationCode', function(code, callback) {
    return this.model('User').find({
        'verification.code': code
    }, callback);
});

UserSchema.pre('save', function(next) {
    this.updated = new Date();
    next();
});



//exports.UserTask = mongoose.model('UserTask', taskSchemaForUser);
module.exports = mongoose.model('User', UserSchema);
