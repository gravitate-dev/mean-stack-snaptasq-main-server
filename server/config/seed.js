/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Community = require('../api/community/community.model');
var User = require('../api/user/user.model');
var UserMessage = require('../api/userMessage/userMessage.model').Message;
var UserMessageThread = require('../api/userMessage/userMessage.model').Thread;
var Task = require('../api/task/task.model');
var Beta = require('../api/beta/beta.model');
var config = require('./environment');
var uuid = require('uuid');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

UserMessageThread.find({}).remove(function() {});
UserMessage.find({}).remove(function() {});
Task.find({}).remove(function() {});
User.find({}).remove(function() {
    User.create({
        name: 'Rohit Jindal',
        provider: 'facebook',
        forgotPassCode: '16b91e98-7ec3-4232-876f-c8bf6cfe1181',
        email: 'rohitjindal@gmail.com',
        __v: 0,
        requiresBeta: true,
        friends: [],
        groups: [],
        otherTasks: [],
        myTasks: [],
        role: 'user',
        verification: {
            code: '4656a75b-f0fc-4f19-8abf-cb07b651969f',
            status: true
        },
        fb: {
            gender: 'male',
            id: '1020448581319794',
            json: {
                id: '1020448581319794',
                last_name: 'Jindal',
                first_name: 'Rohit',
                email: 'rohitjindal@gmail.com',
                name: 'Rohit Jindal',
                link: 'https://www.facebook.com/app_scoped_user_id/1020448581319794/',
                gender: 'male',
            }
        },
        pic: "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xap1/v/t1.0-1/p50x50/11855733_1013864421978210_6164071379240397877_n.jpg?oh=3e70dbdc7fdc21e531425d96f31d4d3e&oe=5678B7C4&__gda__=1449227013_f435cff87ce4cf8d53c62f8f55d112d1"
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
    }, {
        provider: 'local',
        name: 'Test User',
        email: 'test@test.com',
        password: 'test',
        friends: [],
        groups: [],
        otherTasks: [],
        myTasks: [],
        role: 'user',
        verification: {
            status: true
        }
    }, function() {
        //after adding the users we need to friend them!
        console.log('finished populating users');
        User.findOne({
            email: "test@test.com"
        }, function(err, fromUser) {
            User.findOne({
                email: "admin@snaptasq.com"
            }, function(err, toUser) {
                var friendShipToAdmin = {
                    id: fromUser._id,
                    name: fromUser.name,
                    pic: fromUser.pic,
                    source: "snaptasq"
                };
                //make admin friends with test
                var friendShipToTest = {
                    id: toUser._id,
                    name: toUser.name,
                    pic: toUser.pic,
                    source: "snaptasq"
                };
                fromUser.friends.push(friendShipToTest);
                toUser.friends.push(friendShipToAdmin);
                fromUser.save();
                toUser.save();

            });
        })
    })
});
