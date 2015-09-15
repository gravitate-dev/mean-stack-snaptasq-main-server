/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Notify = require('./notify.model');
var _ = require('lodash');

exports.register = function(socket) {
    Notify.schema.post('save', function(doc) {
        //i handle the case FOR ONE
        if (doc.forOne != undefined) {
            if (doc.forOne.toString != undefined) {
                if (doc.forOne.toString() == socket.uid) {
                    return onSave(socket, doc);
                }
            } else {
                console.error("Bad forOne id in notification " + doc.code);
            }
        }
        if (doc.forMany != undefined && !_.isEmpty(doc.forMany)) {
            for (var i = 0; i < doc.forMany.length; i++) {
                if (doc.forMany[i].equals(socket.uid)) {
                    return onSave(socket, doc);
                }
            }
        }

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
