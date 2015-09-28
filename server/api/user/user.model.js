'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['facebook'];
var config = require('../../config/environment');
var _ = require('lodash');

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
    knownIpAddresses: [{
        ip: String,
        popularity: {
            type: Number,
            default: 1
        }
    }],
    link: String, //this will be set with fb comes in
    groups: [{
        id: {
            type: Schema.Types.ObjectId,
            index: true
        },
        name: String,
        pic: String,
        source: String
    }],
    phone: {
        newNumber: String, //this is the temp number before it gets changed to number
        number: String,
        verified: {
            type: Boolean,
            default: false
        },
        ignorePrompt: {
            type: Boolean,
            default: false
        }, //ignore the popup dialog modal
        verifyCode: String,
        enableNotifications: {
            type: Boolean,
            default: true
        },
        attempts: {
            type: Number,
            default: 0
        }
    },
    /** These codes are to invite friends to use the beta **/
    personalBetaCodes: [String],
    canFriend: [Schema.Types.ObjectId],
    doNotAutoFriend: [Schema.Types.ObjectId], //these are people you dont want to auto friend. This happens when a user unfriends a facebook friend
    friends: [friendSchema],
    hashedPassword: String,
    provider: String,
    salt: String,
    requiresBeta: {
        type: Boolean,
        default: false
    }
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


// i need to remove task references
var Task = require('../task/task.model');
var Notify = require('../notify/notify.model');
var Community = require('../community/community.model');
/**
 * Pre-remove hook
 */
UserSchema
    .pre('remove', function(next) {
        var myId = this._id;
        var myFriendsIds = _.pluck(this.friends, 'id');
        var myGroupsIds = _.pluck(this.groups, 'id');
        Task.find({
            ownerId: myId
        }, function(err, tasks) {
            //get all the ids
            var ids = _.pluck(tasks, "_id");
            ids.push(myId);

            Notify.find({
                source: {
                    $in: ids
                }
            }).remove().exec(function(err, docs) {
                Task.find({
                    ownerId: myId
                }).remove().exec(function(err, docs) {
                    //i also need to remove all friendships ever made
                    User.update({
                        _id: {
                            $in: myFriendsIds
                        }
                    }, {
                        $pull: {
                            'friends': {
                                id: myId
                            }
                        }
                    }, {
                        multi: true
                    }, function(err) {
                        if (err) console.error(err);
                        Task.update({
                            'applicants.id': myId
                        }, {
                            $pull: {
                                'applicants': {
                                    id: myId
                                }
                            }
                        }, {
                            multi: true
                        }, function(err) {
                            if (err) console.error(err);
                            Community.update({
                                _id: {
                                    $in: myGroupsIds
                                }
                            }, {
                                $pull: {
                                    'users': {
                                        id: myId
                                    }
                                }
                            }, {
                                multi: true
                            }, function(err) {
                                if (err) console.error(err);
                                next();
                            });
                        });

                    });
                });

            });
        });
        //next();
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
var User = mongoose.model('User', UserSchema);
module.exports = User;
