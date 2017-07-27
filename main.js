"use strict"

var readline = require('readline');
const ChallengeClient = require('./client').ChallengeClient;

var loginObj = {name: 'Bill Carter'};
var timeObj = { "request" : "time" };
var countObj = { "request" : "count" };

// hardcoded but could set via environment
const params = {
    server: '35.188.0.214',
    port: 9432,
    timeout: 2000,
    loginObj: loginObj,
    debug: true
}

function makeClient(p) {
    var cc = new ChallengeClient();
    var _params = p;

    cc.on('connected', () => {
        cc.send(loginObj);
    });

    cc.on('welcome', (data) => {
        console.log('logged in: ' + JSON.stringify(data));
        // cc.send({ "request" : "count", "id" : "abc" });
    });

    cc.on('msg', (data) => {
        // console.log('msg: ' + JSON.stringify(data));
        var msg = data.msg;

        if ('time' in msg) {
            if (msg.random > 30) {
                console.log(msg);
                console.log('time random %d > 30', msg.random);
            }
            console.log('time response: %s', msg.time);
        }
        else if ('count' in msg) {
            console.log('count response: %s', msg.count);
        }

    });

    var sent = false;
    cc.on('heartbeat', (data) => {
        // console.log('heartbeat: ' + JSON.stringify(data));
        if (sent == false) {
            cc.send(timeObj, true);
            sent = true;
        }
    });

    cc.on('dataParseError', (err) => {
        // console.log('dataParseError: ' + err);
    });

    cc.on('socketError', (err) => {
        console.log('socketError: ' + err);
        process.exit();
    });

    cc.connect(_params);

    return cc;
}

function CommandLine(cc) {
    var that = this;
    this._cc = cc;

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });
    // rl.setPrompt('>>> ')
    // rl.prompt();

    function send(objs) {
        that._cc.send(objs, true);
    }

    rl.on('line', function(line){
        // console.log('read; ' + line);

        switch (line) {
            case 'time':
                send(timeObj);
                break;
            case 'count':
                send(countObj);
                break;
            default:
                try {
                    var parsed = JSON.parse(line);
                    send(parsed);
                }
                catch (err) {
                    console.log('JSON parse error %s', err);
                }
        }
        // rl.prompt();
    })
}

var cc = makeClient(params);

var cmndLine = new CommandLine(cc);

process.on('SIGTERM', function(err) {
    console.log(err);
    process.exit();
});


