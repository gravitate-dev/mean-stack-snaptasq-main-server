/**
 * Socket.io configuration
 */

'use strict';
var config = require('./environment');
// When the user disconnects.. perform this
function onDisconnect(socket) {
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  // Insert sockets below
  require('../api/zombie/zombie.socket').register(socket);
  require('../api/task/task.socket').register(socket);
  //require('../api/thing/thing.socket').register(socket);
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));
/*
socketio.set('authorization', function(handshake, callback) {
  if (handshake.headers.cookie) {
    console.log("THERE IS A HANDSHAKE");
    // pass a req, res, and next as if it were middleware
    parseCookie(handshake, null, function(err) {
      console.log("Im parsin coookie");
      handshake.sessionID = handshake.signedCookies['connect.sid'];
      // or if you don't have signed cookies
      handshake.sessionID = handshake.cookies['connect.sid'];

      store.get(handshake.sessionID, function (err, session) {
        if (err || !session) {
          // if we cannot grab a session, turn down the connection
          callback('Session not found.', false);
        } else {
          // save the session data and accept the connection
          handshake.session = session;
          callback(null, true);
        }
      });
    });
  } else {
    console.log("No sessison");
    return callback('No session.', false);
  }
  callback(null, true);
});
*/

  socketio.on('connection', function (socket, req, res) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.HOST;

    socket.connectedAt = new Date();
    var session = socket.handshake.session;
    console.log(session);
    //parseCookie(socket.id);

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.id);
    });

    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket.id);
    socket.on('pasta',function(){
      console.log("PASTA WAS HEARD");
    });

    socket.emit("pasta",{
        payload: "some data",
        source: "another data"
      });
  });

};