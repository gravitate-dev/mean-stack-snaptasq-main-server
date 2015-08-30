/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Community = require('../api/community/community.model');
var User = require('../api/user/user.model');
var Task = require('../api/task/task.model');
var Beta = require('../api/beta/beta.model');
var uuid = require('uuid');

Community.find({}).remove(function() {
    Community.create({
            name: "Public Group 1",
            status: "public",
            challenges: [{
                    id: uuid.v4(),
                    type: "open",
                    answers: [""],
                    prompt: "This community is open to anyone"
                }] // ignored if group is public
        }, {
            name: "Private group requires click join",
            status: "private",
            challenges: [{
                    id: uuid.v4(),
                    type: "open",
                    answers: [""],
                    prompt: "This community is open to anyone"
                }] // ignored if group is public
        }, {
            name: "Private group 510 area code",
            status: "private",
            challenges: [{
                    id: uuid.v4(),
                    type: "areacode",
                    answers: ["510"],
                    prompt: "This community is open to anyone"
                }] // ignored if group is public
        }, {
            name: "Private group secret password aladdin",
            status: "private",
            challenges: [{
                    id: uuid.v4(),
                    type: "code",
                    answers: ["aladdin"],
                    prompt: "This community is open to anyone"
                }] // ignored if group is public
        }, {
            name: "Gmail Users Only",
            status: "private",
            challenges: [{
                    id: uuid.v4(),
                    type: "email",
                    answers: ["@gmail.com"],
                    prompt: "Requires a Gmail email"
                }] // ignored if group is public
        }

    );
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
