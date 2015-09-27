var _ = require('lodash');
var config = require('../../config/environment')
var client = require('twilio')(config.SMS_TWILIO_SSID, config.SMS_TWILIO_AUTH_TOKEN);

function text(to, msg) {
    client.sendMessage({

        to: to, // Any number Twilio can deliver to
        from: config.TWILIO_PHONE_NUMBER, // A number you bought from Twilio and can use for outbound communication
        body: msg // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            //console.log(responseData.from); // outputs "+14506667788"
            //console.log(responseData.body); // outputs "word to your mother."

        }
    });
}

function call(to) {
    client.makeCall({

        to: to, // Any number Twilio can call
        from: config.TWILIO_PHONE_NUMBER, // A number you bought from Twilio and can use for outbound communication
        url: 'http://www.example.com/twiml.php' // A URL that produces an XML document (TwiML) which contains instructions for the call

    }, function(err, responseData) {

        //executed when the call has been initiated.
        console.log(responseData.from); // outputs "+14506667788"

    });
}

module.exports = {
    text: text,
    call: call
};
