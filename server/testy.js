var CryptoJS = require("crypto-js");

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
// Encrypt
var ciphertext = CryptoJS.AES.encrypt('my message adwadahwuawhfuhawaoifwjawi//adjaiAWDAWD', 'secret key 123').toString();
console.log(ciphertext);
ciphertext = ciphertext.replace(/\+/g, 'PLUS').replace(/\-/g, 'MINUS').replace(/\//g, 'SLASH').replace(/=/g, 'EQUALS');
console.log(ciphertext);
// Decrypt
ciphertext = replaceAll(ciphertext, 'PLUS', '+');
ciphertext = replaceAll(ciphertext, 'MINUS', '-');
ciphertext = replaceAll(ciphertext, 'SLASH', '/');
ciphertext = replaceAll(ciphertext, 'EQUALS', '=');
console.log(ciphertext);
var bytes = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
var plaintext = bytes.toString(CryptoJS.enc.Utf8);
console.log(plaintext);
