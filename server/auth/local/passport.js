var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function(User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password' // this is the virtual field on the model
        },
        function(email, password, done) {
            console.log("OK");
            User.findOne({
                email: email.toLowerCase()
            }, function(err, user) {
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
                return done(null, user);
            });
        }
    ));
};
