'use strict';

angular.module('snaptasqApp')
    .controller('UserMessagesCtrl', function($scope, UserMessage, $timeout, $location, Notification) {
        $scope.messages = [];
        $scope.friendRequests = [];
        $scope.inboxType = "primary";

        $scope.switchBox = function(boxName) {
            $scope.inboxType = boxName;
            $scope.refreshInbox(false);
        }
        $scope.refreshInbox = function(notifyUser, both) {
            var offset = 0;
            var limit = 20;
            var refreshPrimary = ($scope.inboxType == "primary") || both;
            var refreshFriends = ($scope.inboxType == "friends") || both;
            if (refreshPrimary) {
                UserMessage.getPrimary(offset, limit, function(data) {
                    if (notifyUser) {
                        Notification.success({
                            message: 'Inbox Updated',
                            replaceMessage: true
                        });
                    }
                    $scope.messages = data;
                }, function(fail) {
                    Notification.success({
                        message: "Inbox Already Updated",
                        replaceMessage: true
                    });
                });
            }
            if (refreshFriends) {
                UserMessage.getFriends(offset, limit, function(data) {
                    if (notifyUser) {
                        Notification.success({
                            message: 'Inbox Updated',
                            replaceMessage: true
                        });
                    }
                    $scope.friendRequests = data;
                }, function(fail) {
                    Notification.success({
                        message: "Inbox Already Updated",
                        replaceMessage: true
                    });
                });
            }
        };
        $scope.refreshAllInboxes = function(notifyUser) {
            $scope.refreshInbox(notifyUser, true);
        }


        $scope.hideMessage = function($event, $index, thread) {
            console.log($index);
            UserMessage.hideConversation(thread._id, function(success) {
                Notification.success("Conversation removed");
                $scope.messages.splice($index, 1);
            }, function(fail) {
                Notification.error("Error removing conversation.");
            });
            $event.preventDefault();

        }
        $scope.refreshAllInboxes(false);
    })
    .controller('NewUserMessageCtrl', function($scope, _me, User, UserMessage, $location, $timeout, Notification) {
        $scope.msg = {
            body: "",
            type: "normal",
            title: ""
        };
        _me.$promise.then(function(me) {
            $scope._me = me;
        });

        $scope.$watch('msg.body', _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.$apply(function() {
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                //count the # of newlines and limit it
                var newlineCount = newvalue.split(/\r\n|\r|\n/).length;
                if (newlineCount > 10) {
                    $scope.tooManyNewLines = true;
                } else {
                    $scope.tooManyNewLines = false;
                }
            });
        }, 200));

        $scope.sendMessage = function() {
            if (angular.isUndefined($scope.msg.to) || angular.isUndefined($scope.msg.to.originalObject)) {
                return Notification.error("Please enter a valid recipient")
            }
            var target = $scope.msg.to.originalObject;
            if (_.isEmpty($scope.msg.body)) {
                return Notification.error("Please enter a message to send.")
            }
            if (_.isEmpty($scope.msg.title)) {
                return Notification.error("Please enter a title");
            }
            UserMessage.create({
                toId: target.id,
                type: "normal"
            }, {
                title: $scope.msg.title,
                body: $scope.msg.body,
                type: $scope.msg.type,
            }, function(success) {
                Notification.success("Message sent");
                $location.path('/message/' + success.threadId);
            }, function(fail) {
                Notification.error("There was an error sending your message");
            });
        }
    }).controller('UserMessageCtrl', function($scope, _me, User, UserMessage, $timeout, $location, $route, $routeParams, Notification) {
        $scope.messages = [];
        $scope.id = $routeParams.id;
        $scope.replyMessage = "";
        $scope.thread = {};
        $scope.friendId = undefined;



        $scope.notFriendsYet = function(otherPersonsId) {
            for (var i = 0; i < $scope._me.friends.length; i++) {
                if ($scope._me.friends[i].id == otherPersonsId) {
                    return false;
                }
            }
            return true;
        }

        $scope.acceptFriend = function(otherId, messageId) {
            User.addFriend(otherId, messageId, function(response) {
                Notification.success("Friend added");
                $timeout(function() {
                    $location.path('/messages');
                }, 1000);
            }, function(fail) {
                console.error(fail);
                Notification.error("An error happened");
            });
        }
        $scope.rejectFriend = function(otherId) {
            UserMessage.delete($scope.message._id, function(response) {
                $location.path('/messages');
            }, function(fail) {
                Notification.error("An error occured");
            });
        }
        _me.$promise.then(function(me) {
            $scope._me = me;
            if ($scope.id == undefined) return;


            UserMessage.getThreadById($scope.id, function(success) {
                $scope.thread = success;
                //this code will get the other persons id in the message
                var temp = _.filter($scope.thread.ownerIds, function(item) {
                    return item != _me._id;
                });
                if (temp.length != 1) {
                    return console.error("ownerID is broken");
                } else {
                    $scope.friendId = temp[0];
                }
            });
            UserMessage.getMessagesByThreadId($scope.id, function(messages) {
                if (messages == undefined || _.isEmpty(messages)) {
                    Notification.error("This message thread no longer exists");
                    $location.path('/messages');
                } else {
                    $scope.messages = messages;
                }
            });
        });

        $scope.$watch('replyMessage', _.debounce(function(newvalue) {
            // This code will be invoked after 1 second from the last time 'id' has changed.
            $scope.$apply(function() {
                if (angular.isUndefined(newvalue)) {
                    return;
                }
                //count the # of newlines and limit it
                var newlineCount = newvalue.split(/\r\n|\r|\n/).length;
                if (newlineCount > 10) {
                    $scope.tooManyNewLines = true;
                } else {
                    $scope.tooManyNewLines = false;
                }
            });
        }, 200));
        $scope.respondToThread = function(reply) {
            if ($scope.tooManyNewLines) {
                return Notification.error("Your reply can only take up 10 lines. Remove extra spaces and try to send again.");
            }
            UserMessage.replyToThread($scope.id, reply, function(data) {
                Notification.success("Your reply was sent");
                $timeout(function() {
                    $route.reload();
                }, 100);
            }, function(fail) {
                if (angular.isUndefined(fail)) {
                    return Notification.error("Failed");
                }
                if (fail.data) {
                    return Notification.error(fail.data);
                } else {
                    return Notification.error(fail);
                }
            });
        }
    });
