/* This is used to process queries on our backend such as:
age: pagination
name: regex
*/

//todo validate if dsl is valid perhaps by a checksum or something
// WARNING! this logic using last age is prone to a bug.
// Explanation
// I get 10 results and i use the oldest document if the next result say result 11, is equal
// to the oldest document time it will SKIP this guy. This will happen if the 10th task and 11th
// are created AT THE SAME SECOND. this is HIGHLY unlikely, to prevent this
// i can enhance this by saying find the next 10 documents which are greater than OR EQUAL<-- to
// the time, AND not _id NOT EQUAL to the oldest document. But this is will also cause errors
// so just leave it like it is.
var moment = require('moment');
var mongoose = require('mongoose');
exports.processSearch = function(req, res, next) {
    var query = {};
    var age = req.param('age'); //age means the oldest document
    if (age != undefined) {
        if (moment(age).isValid()) {
            query.created = {
                $lt: age
            };
        } else {
            console.error("Age requested is invalid", age);
            return res.status(500).json([]);
        }
    }
    //id is not good
    /*
    var id = req.param('lastId'); //age means the oldest document
    if (id!=undefined){
        if (mongoose.Types.ObjectId.isValid(id)){
            query._id = { $lt : id };
        } else {
            console.error("Object ID is invalid",id);
            return res.status(500).json([]);
        }
    }
    */
    var name = req.param('name');
    if (name != undefined) {
        if (name.match(/^[-\sa-zA-Z0-9\']+$/) == null) {
            console.error("Invalid name in dsl, ", name);
            return res.status(500).json([]);
        }
        //then add it
        query.name = new RegExp('^' + name, "i");
    }
    req.dsl = query;
    next();
}
