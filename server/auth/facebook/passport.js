var passport = require('passport');
var User = require('../../api/user/user.model');
var FacebookStrategy = require('passport-facebook').Strategy;
var graph = require('fbgraph');
var uuid = require('uuid');
var config = require('../../config/environment');

function isLoggedIn(req){
  return req.cookies.token!=undefined;
}

function createNewUserWithFacebook(user,req, accessToken, refreshToken, profile, done) {
  user = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      role: 'user',
      username: profile.username,
      provider: 'facebook',
      isConnectedWithFb:true,
      hasConnectedWithFbOnce:true,
      requiresBeta: config.betaTrails
    });
  user.verification.code = uuid.v4();
  user.forgotPassCode = uuid.v4();
  user.verification.status=true;
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
  if (profile.photos && profile.photos.length != 0) {
    /**
     * If the fb picture is given to me its nice
     * I will take it then be done
    **/
      user.fb.pic = profile.photos[0].value;
      user.pic = user.fb.pic;
      user.save(function(err) {
          if (err) done(err);
          return done(err, user);
      });
    user.save(function(err) {
      if (err) done(err);
      req.user = user;
      return done(err, user);
    });
  }  else {
      /**
       * Sometimes the fb pic may not be sent I will have to get this asynchrnously
       * Then i will save it then I will call done
       **/
      graph.get('/me?fields=picture', {
          access_token: accessToken
      }, function(err, res) {
          if (!err && res.picture && res.picture.data && res.picture.data.url) {
              user.fb.pic = res.picture.data.url;
              user.pic = user.fb.pic;
          }
          user.save(function(err) {

              if (err){
                  done(err);
              } 
              //success here
              return done(err,user);
          });
      });
  }
}
function linkFacebookAccountToExistingUser(user,req, accessToken, refreshToken, profile, done) {
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

if (profile.photos && profile.photos.length != 0) {
  /**
   * If the fb picture is given to me its nice
   * I will take it then be done
  **/
    user.fb.pic = profile.photos[0].value;
    user.pic = user.fb.pic;
    user.save(function(err) {
        if (err) done(err);
        return done(err, user);
    });
} else {
    /**
     * Sometimes the fb pic may not be sent I will have to get this asynchrnously
     * Then i will save it then I will call done
     **/
    graph.get('/me?fields=picture', {
        access_token: accessToken
    }, function(err, res) {
        if (!err && res.picture && res.picture.data && res.picture.data.url) {
            user.fb.pic = res.picture.data.url;
            user.pic = user.fb.pic;
        }
        user.save(function(err) {
            if (err) done(err);
            return done(err, user);
        });
    });
}

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
        console.log(currentUserId);

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
                  }, function(err,fbuser){
                    if (err){ return done(err)}
                    if (fbuser) {
                      /** 1. return fbuser **/
                      //TODO: Check to see if the account id is under the current user, if its not
                      //then i will have to display a notification telling them about that.
                      console.log("Found a facebook account logging you in with that one");
                      return done(err, fbuser);
                    } else {
                      isFacebookProfileRegistered = false;
                    }

                    if (!isFacebookProfileRegistered){
                      /** 2a. Check if fb account is not yet linked **/
                      if (isLoggedIn(req)){
                        User.findOne({
                          '_id': currentUserId
                        }, function(err, user) {
                          if (err) return done(err);
                          if (!user) {
                            /** 2b. profile not found by id create a new account **/
                              console.log("Creating a new account based off facebook");
                              return createNewUserWithFacebook(user, req, accessToken, refreshToken, profile, done)
                          } else {
                            if (user.fb ==undefined || user.fb.id == undefined){
                              console.log("Linking your facebook account to this sharetask account",user.email);
                              return linkFacebookAccountToExistingUser(user, req, accessToken, refreshToken, profile, done);
                            } else {
                              console.log("Nothing to do, this account is already linked with a facebook account");
                              return done(err,user);
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
    }
))};