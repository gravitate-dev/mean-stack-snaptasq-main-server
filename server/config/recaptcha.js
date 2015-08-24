/**
 * Recaptcha Module
 */

'use strict';
var https = require('https');
var SECRET = "6LfjmgcTAAAAABF_At9YHCcTuG1du6DMf3M9l5_G";

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}
exports.check = function(req, res, next) {
    verifyRecaptcha(req.param('captcha'), function(success) {
        if (success) {
            next();
        } else {
            return res.status(500).json({
                status: "error",
                message: 'Please verify you are a person with our CAPTCHA.'
            })
        }
    })
};
