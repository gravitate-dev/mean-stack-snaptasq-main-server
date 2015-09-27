var uuid = require('uuid');

// Generate a v1 (time-based) id 
uuid.v1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a' 

// Generate a v4 (random) id 
var u = uuid.v4(); // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1' 
console.log(u.substr(0, 4));
