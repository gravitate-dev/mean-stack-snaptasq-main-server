// run me with phantomjs --disk-cache=no angular-seo-server.js 9090 http://127.0.0.1:8000/
// C:\Users\robbie\AppData\Roaming\npm\node_modules\phantomjs\lib\phantom\phantomjs.exe --disk-cache=no angular-seo-server.js 9090 http://127.0.0.1:8000/
// C:\Users\robbie\AppData\Roaming\npm\node_modules\phantomjs\lib\phantom\phantomjs.exe --disk-cache=no angular-seo-server.js 9090 http://127.0.0.1:8000/
var system = require('system');

if (system.args.length < 3) {
    console.log("Missing arguments.");
    phantom.exit();
}

var server = require('webserver').create();
var port = parseInt(system.args[1]);
var urlPrefix = system.args[2];

var parse_qs = function(s) {
    var queryString = {};
    var a = document.createElement("a");
    a.href = s;
    a.search.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { queryString[$1] = $3; }
    );
    return queryString;
};

var renderHtml = function(url, cb) {
    var page = require('webpage').create();
    page.settings.loadImages = false;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.onCallback = function() {
        cb(page.content);
        page.close();
    };
    page.onConsoleMessage = function(msg, lineNum, sourceId) {
        console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
    page.onInitialized = function() {

       page.evaluate(function() {
            setTimeout(function() {
                window.callPhantom();
            }, 10000);
        });
    };
    //page.clearMemoryCache();
    page.open(url);
};

server.listen(port, function (request, response) {
    var route = parse_qs(request.url)._escaped_fragment_;
    var url;
    url = urlPrefix;
    if (request.url.indexOf('?')!=-1){
        url += request.url.slice(1, request.url.indexOf('?')); 
    } else {
        url += request.url;
    }

    if (route!=undefined){
        url += '#!' + decodeURIComponent(route);    
    }
    console.log("PhantomJSing: " + url);
    renderHtml(url, function(html) {
        response.statusCode = 200;
        response.write(html);
        response.close();
    });
});

console.log('Listening on ' + port + '...');
console.log('Press Ctrl+C to stop.');