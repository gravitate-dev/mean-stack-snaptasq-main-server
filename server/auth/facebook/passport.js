var passport = require('passport');
var User = require('../../api/user/user.model');
var UserController = require('../../api/user/user.controller');
var FacebookStrategy = require('passport-facebook').Strategy;
var graph = require('fbgraph');
var uuid = require('uuid');
var config = require('../../config/environment');
var _ = require('lodash');

function isLoggedIn(req) {
    return req.cookies.token != undefined;
}

function linkFriendsOnSnaptasqToMeAsync(req, user, accessToken, cb) {
    UserController.hasFbPermissionInternalByUserObject(user, 'user_friends', function(hasPermission) {
        if (!hasPermission) {
            console.log("User did not give user_friends permission");
            return cb(user);
        }
        if (user.fb.id == undefined) {
            console.error("user has no property fb.id in linkFriendsOnSnaptasqToMeAsync");
            return cb(user);
        }
        graph.get('/' + user.fb.id + '/friends', {
            access_token: accessToken
        }, function(err, response) {
            if (err) {
                console.error(err, "linkFriendsOnSnaptasqToMeAsync");
                return cb(user);
            }
            if (response.data) {
                /*var f = {
                    id: "realsnaptasquserid",
                    name: "Deleted Friend",
                    externalId: "1337",
                    source:"facebook"
                };
                user.friends = [];
                user.friends.push(f);
                */

                //console.log(response.data);
                var fbFriendCount = response.data.length;
                var fbFriends = _.filter(user.friends, function(item) {
                    return item.source === 'facebook';
                });
                var NonfbFriends = _.filter(user.friends, function(item) {
                    return item.source !== 'facebook';
                });
                var newFriends = NonfbFriends;
                var currentFbFriendIds = _.pluck(fbFriends, "externalId");
                var requestFbFriendIds = _.pluck(response.data, 'id');
                //find the differences and store them seperately
                //difference source, compareTo
                //will keep whats diff on the left guy
                //lets find the friends i have yet to delete

                //console.log("Current fb friend ids",requestFbFriendIds);
                //console.log("REQUEST fb friend ids",currentFbFriendIds);
                var notDeltdYetIds = _.difference(currentFbFriendIds, requestFbFriendIds);
                //console.log("Should delete these: ",notDeltdYetIds);
                // lets remove the deleted friends from the user
                //console.log("Before fbFriends",fbFriends)
                var fbFriends = _.filter(fbFriends, function(item) {
                    return !_.contains(notDeltdYetIds, item.externalId);
                });
                //console.log("After fbFriends",fbFriends)
                //console.log(user.friends);

                for (var i = 0; i < fbFriends.length; i++) {
                    newFriends.push(fbFriends[i]);
                }
                user.friends = newFriends;
                //console.log("after removed fakes:",fbFriends.length);
                //lets find the friends that arent added yet
                var notAddedYetIds = _.difference(requestFbFriendIds, currentFbFriendIds);
                //console.log("NOT ADDED",notAddedYetIds);
                // now lets add in the missing friends
                User.find({
                    'fb.id': {
                        $in: notAddedYetIds
                    }
                }, function(err, newFwends) {
                    if (err) return cb(user);
                    if (!newFwends) return cb(user);
                    _.each(newFwends, function(friend) {
                        var f = {
                            id: friend._id,
                            name: friend.name,
                            externalId: friend.fb.id,
                            pic: friend.pic,
                            source: "facebook"
                        };
                        user.friends.push(f);
                    });
                    //console.log("After putting friends in ",user.friends.length);
                    return cb(user);
                });
                /*
                var friendSchema = new Schema({
                    id: Schema.Types.ObjectId,
                    name: String,
                    pic: {
                        type: String,
                        default: "assets/logos/no_avatar.gif"
                    },
                    externalId: String, //this is like their fbID
                    source:{type: String, default: "snaptasq"} //soource is where you got the friend, it can be facebook, snaptasq, twitter, etc
                });
                    */
            } else {
                console.log("Error in linkFriendsOnSnaptasqToMeAsync no data returned");
                return cb(user);
            }
        });

    });
}

function getFbPicFromProfileObj(user, req, accessToken, profile, cb) {
    if (profile.photos && profile.photos.length != 0) {
        try {
            user.fb.pic = profile.photos[0].value;
            user.pic = user.fb.pic;
        } catch (e) {
            console.log(e);
        }
        return cb(user);
    } else {
        graph.get('/me?fields=picture', {
            access_token: accessToken
        }, function(err, res) {
            if (!err && res.picture && res.picture.data && res.picture.data.url) {
                user.fb.pic = res.picture.data.url;
                user.pic = user.fb.pic;
            }
            return cb(user);
        });
    }
}

function createNewUserWithFacebook(user, req, accessToken, refreshToken, profile, done) {
    var usr = {
        name: profile.displayName,
        role: 'user',
        username: profile.username,
        provider: 'facebook',
        isConnectedWithFb: true,
        hasConnectedWithFbOnce: true,
        requiresBeta: config.betaTrails,
        verification: {
            code: uuid.v4(),
            status: true
        },
        forgotPassCode: uuid.v4()
    };
    try {
        var email = profile.emails[0].value;
        usr.email = email;
        user.fb.email = email;
    } catch (e) {}
    user = new User(usr);
    try {
        user.fb.username = profile.displayName || profile.username;
        user.fb.json = profile._json;
        user.fb.id = profile.id;
        user.fb.accessToken = accessToken;
        user.fb.refreshToken = refreshToken;
        user.fb.profileUrl = profile.profileUrl;
        user.fb.gender = profile.gender;
    } catch (e) {
        console.log(e);
    }
    getFbPicFromProfileObj(user, req, accessToken, profile, function(user) {
        linkFriendsOnSnaptasqToMeAsync(req, user, accessToken, function(user) {
            user.save(function(err) {
                if (err) done(err);
                return done(err, user);
            });
        });
    });
}

function linkFacebookAccountToExistingUser(user, req, accessToken, refreshToken, profile, done) {
    user.name = profile.displayName || profile.username;
    user.isConnectedWithFb = true;
    user.hasConnectedWithFbOnce = true;
    user.fb.email = profile.emails[0].value;
    user.fb.username = profile.displayName || profile.username;
    user.fb.json = profile._json;
    user.fb.id = profile.id;
    user.fb.accessToken = accessToken;
    user.fb.refreshToken = refreshToken;
    user.fb.profileUrl = profile.profileUrl;
    user.fb.gender = profile.gender;

    getFbPicFromProfileObj(user, req, accessToken, profile, function(user) {
        linkFriendsOnSnaptasqToMeAsync(req, user, accessToken, function(user) {
            user.save(function(err) {
                if (err) done(err);
                return done(err, user);
            });
        });
    });
}
exports.setup = function(User, config) {
    passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        passReqToCallback: true,
        profileFields: ['id', 'name', 'emails', 'displayName', 'link', 'gender', 'friends']
    }, function(req, accessToken, refreshToken, profile, done) {
        var currentUserId = req.session.userId;

        /* This is how login will work */
        /* 1.  Check for facebook profile id already registered, if so then return that user
         * 2a. IF THEY ARE LOGGED IN, check to make sure the facebook profile is not registered, if so, link the facebook with this account.
         * 2b. ELSE no such facebook profile id user found, then create a new user for this facebook account, then return the new user.
         * 3.  If the current user is already linked with a DIFFERENT facebook account or there is no current user, then create a new user with this facebook account, return that user
         */

        /** 1. **/
        var isFacebookProfileRegistered = true;
        User.findOne({
            'fb.id': profile.id
        }, function(err, fbuser) {
            if (err) {
                return done(err)
            }
            if (fbuser) {
                /** 1. return fbuser **/
                //TODO: Check to see if the account id is under the current user, if its not
                //then i will have to display a notification telling them about that.
                console.log("Found a facebook account logging you in with that one");
                if (isLoggedIn(req)) {
                    if (fbuser._id.equals(currentUserId)) {
                        console.log("Reauth case");
                        //this will happen if a user wants to give permissions to the same account.
                        //this is not connecting this is fine.
                        return done(err, fbuser);
                    } else {
                        console.error("This account is already used to link a different facebook account. I should return error");
                        return done(err);
                    }
                } else {
                    linkFriendsOnSnaptasqToMeAsync(req, fbuser, accessToken, function(user) {
                        user.save(function(err) {
                            if (err) done(err);
                            return done(err, user);
                        });
                    });
                }
                //if so then error message because the account is already linked

                //return done(err, fbuser);
            } else {
                /** 2a. Check if fb account is not yet linked **/
                if (isLoggedIn(req)) {
                    User.findOne({
                        '_id': currentUserId
                    }, function(err, user) {
                        if (err) return done(err);
                        if (!user) {
                            /** 2b. profile not found by id create a new account **/
                            console.log("Creating a new account based off facebook");
                            return createNewUserWithFacebook(user, req, accessToken, refreshToken, profile, done)
                        } else {
                            if (user.fb == undefined || user.fb.id == undefined) {
                                console.log("Linking your facebook account to this sharetask account", user.email);
                                return linkFacebookAccountToExistingUser(user, req, accessToken, refreshToken, profile, done);
                            } else {
                                //check if already logged into an account
                                return done(err, user);
                            }
                        }
                    });
                } else {
                    /** 3. an unlinked fb account without being logged in creates a new account **/
                    console.log("Creating a new account based off facebook,also you are not logged in.");
                    return createNewUserWithFacebook(fbuser, req, accessToken, refreshToken, profile, done)
                }
            }
        });
    }))
};
