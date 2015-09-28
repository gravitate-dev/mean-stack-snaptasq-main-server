var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var SCHEMA_USER_HIDE_FROM_ME = '-verification.code -forgotPassCode -phone.verifyCode -phone.attempts';
exports.setup = function(User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password' // this is the virtual field on the model
        },
        function(email, password, done) {
            User.findOne({
                email: email.toLowerCase()
            }, SCHEMA_USER_HIDE_FROM_ME, function(err, user) {
                if (err) return done(err);

                if (!user) {
                    return done(null, false, {
                        message: 'Sorry, your email/password do not match. You can try forgot your password.'
                    });
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Sorry, your email/password do not match. You can try forgot your password.' //'This password is not correct.'
                    });
                }
                delete user.salt;
                delete user.hashedPassword;
                return done(null, user);
            });
        }
    ));
};
