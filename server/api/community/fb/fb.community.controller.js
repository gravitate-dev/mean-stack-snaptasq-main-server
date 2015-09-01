var _ = require('lodash');
var Community = require('../community.controller');
var CommunityModel = require('../community.model');
var User = require('../../user/user.model');
var config = require('../../../config/environment');
var graph = require('fbgraph');

exports.processJoinUrl = function(req, res) {
    //given a url it will see if its facebook
    //https://www.facebook.com/groups/165644006892325/
    //https://www.facebook.com/groups/findyournextopportunity/
    var url = req.param('url');
    if (url == undefined) return res.send(500, "Missing url");
    if (url.indexOf("facebook") == -1) return res.send(500, "Given Url is not a facebook group url");

    _getGroupIdFromUrl(req, res, url, function(groupId) {
        _isUserAllowedToGroup(req, res, groupId, function(allowed) {
            //this call consumes res for us

            //check if group exists
            Community.doesCommunityExistByIdentifier(groupId, "facebook", function(possibleGroup) {
                if (possibleGroup == null) {
                    //if no community
                    _getGroupData(req, res, groupId, function(groupData) {
                        var model = {
                            identifier: groupData.id,
                            name: groupData.name,
                            url: groupData.link,
                            description: groupData.description,
                            source: "facebook"
                        };
                        if (groupData.cover && groupData.cover.source) {
                            model.pic = groupData.cover.source;
                        }
                        CommunityModel.create(model, function(err, comm) {
                            if (err) {
                                return res.send(500, "Could not create a community");
                            }
                            // req and res are consumed by this call
                            return Community._joinInternal(req, res, comm._id, req.session.userId);

                        });
                    });
                } else {
                    //if community already exists then add the person to the group!
                    //req res are consumed
                    return Community._joinInternal(req, res, possibleGroup._id, req.session.userId);
                }
            });
        });
    });
};
exports.join = function(req, res) {
    return res.send(200, "Not implemeneted");
}


/**
 * @pre: requires an auth token first in the router i have specified for req.token check index.js
 *
 **/
function _getGroupIdFromUrl(req, res, url, cb) {
    if (req.token == undefined) {
        return res.send(400, "Call getFbAccessToken first");
    }
    //https://www.facebook.com/groups/165644006892325/
    //https://www.facebook.com/groups/findyournextopportunity/
    var start = url.indexOf(".com/groups") + 12;
    url = url.substr(start);

    //165644006892325/
    //findyournextopportunity/
    var end = url.indexOf("/");
    if (end != -1) {
        url = url.substr(0, end);
    }

    var isnum = /^\d+$/.test(url);
    if (isnum) {
        return cb(url);
    } else {
        //get the groupid by doing a search with the fb token
        var query = '/search?q=' + url + '&type=group';
        graph.get(query + "&access_token=" + req.token, function(err, response) {
            if (err) return res.send(500, "Facebook graph query failed in searching for a group");
            if (!response) return res.send(404, "No Response. Facebook graph query failed in searching for a group");
            if (response.data.length == 0) return res.send(404, "Facebook group not found with the given url");
            return cb(response.data[0].id)
        });
    }
}
/**
 * Call _getGroupIdFromUrl first 
 **/
function _isUserAllowedToGroup(req, res, groupId, cb) {
    //if they are not allowed the response.data.length==0 or error will be there
    if (req.token == undefined) {
        return res.send(400, "Call getFbAccessToken first");
    }
    var query = '/' + groupId + '/members?limit=1';
    graph.get(query + "&access_token=" + req.token, function(err, response) {
        if (err) return res.send(500, "Facebook graph query failed in searching for a group");
        if (!response) return res.send(404, "No Response. Facebook graph query failed in searching for a group");
        if (response.data.length == 0) return res.send(404, "Not allowed into group");
        return cb(true);
    });
}

function _getGroupData(req, res, groupId, cb) {
    if (req.token == undefined) {
        return res.send(400, "Call getFbAccessToken first");
    }
    var query = '/' + groupId + '?fields=id,name,link,cover,description';
    graph.get(query + "&access_token=" + req.token, function(err, response) {
        if (err) return res.send(500, "Facebook graph query failed in searching for a group");
        if (!response) return res.send(404, "No Response. Facebook graph query failed in searching for a group");
        return cb(response);
    });
}
