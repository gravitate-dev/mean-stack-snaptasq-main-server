/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Community = require('../api/community/community.model');
var User = require('../api/user/user.model');
var Task = require('../api/task/task.model');
var Beta = require('../api/beta/beta.model');

/*
var CommunitySchema = new Schema({
  name:{ type: String },
  entryMethod:{ type: String, default:"email" }, // email, open, areacode
  entryParam:{type: String, default: ""}, //this can be suffix or area code
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});
*/

Community.find({}).remove(function() {
    Community.create({
        name: "Public Group 1",
        entryMethod: "open",
        entryParam: "", // ignored if group is public
    }, {
        name: "Gmail Users Only",
        entryQuestion: "Requires a Gmail email",
        entryMethod: "email",
        entryParam: "@gmail.com"
    });
});
Beta.find({}).remove(function() {
    Beta.create({
        maxUses: 1,
        name: "SNAPTEST"
    }, {
        maxUses: 99,
        name: "wawa"
    });
});

Task.find({}).remove();
User.find({}).remove(function() {
    User.create({
        provider: 'local',
        name: 'Test User',
        email: 'test@test.com',
        password: 'test',
        verification: {
            status: true
        }
    }, {
        provider: 'local',
        name: 'Friends User A',
        email: 'frienda@test.com',
        password: 'test',
        verification: {
            status: true
        }
    }, {
        provider: 'local',
        name: 'Friends User B',
        email: 'friendb@test.com',
        password: 'test',
        verification: {
            status: true
        }
    }, {
        provider: 'local',
        role: 'admin',
        name: 'Admin',
        email: 'admin@snaptasq.com',
        password: 'wawa',
        verification: {
            status: true
        },
    }, function() {
        //after adding the users we need to friend them!

        console.log('finished populating users');
    });
});
