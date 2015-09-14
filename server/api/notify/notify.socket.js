/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Notify = require('./notify.model');
var _ = require('lodash');

exports.register = function(socket) {
    Notify.schema.post('save', function(doc) {
        if (doc.forOne != undefined) {
            if (doc.forOne.toString != undefined) {
                if (doc.forOne.toString() == socket.uid) {
                    console.log("NOTIFICATION FOR ME", socket.uid);
                }
            }
        }
        onSave(socket, doc);
    });
    /*Task.schema.post('remove', function(doc) {
        onRemove(socket, doc);
    });
	*/
}

function onSave(socket, doc, cb) {
    socket.emit('notify:save', doc);
}

function onRemove(socket, doc, cb) {
    socket.emit('notify:remove', doc);
}
