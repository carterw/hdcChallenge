"use strict"

var readline = require('readline');
const ChallengeClient = require('./client').ChallengeClient;

var loginObj = {name: 'Bill Carter'};
var timeObj = { "request" : "time" };
var countObj = { "request" : "count" };

// hardcoded but could set via environment
const params = {
    server: '35.188.0.214',
    // server: '127.0.0.1',
    port: 9432,
    timeout: 2000,
    loginObj: loginObj,
    debug: false
}

var cc = makeClient(params);

var cmndLine = new CommandLine(cc);

function makeClient(p) {
    var cc = new ChallengeClient();
    var _params = p;

    cc.on('connected', () => {
        cc.send(loginObj);
    });

    cc.on('welcome', (data) => {
        console.log('logged in: ' + JSON.stringify(data));
        cmndLine.start();
    });

    var sent = false;
    cc.on('heartbeat', (data) => {
        // console.log('heartbeat: ' + JSON.stringify(data));
        if (sent == false) {
            cc.send(timeObj);
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
    this.started = false;

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    that.rl = rl;
    rl.setPrompt('>>> ')
    // rl.prompt();

    function send(obj, callback) {
        that._cc.send(obj, callback);
    }

    this.start = function() {
        rl.prompt();
        if (that.started)
            return;
        else
            that.started = true;

        that.rl.on('line', function(line){
            // console.log('read; ' + line);

            switch (line) {
                case 'time':
                    send(timeObj, (inData) => {
                        // console.log(inData);
                        var msg = inData.msg;
                        if (msg.random > 30) {
                            console.log(msg);
                            console.log('time random %d > 30', msg.random);
                        }
                        console.log('time response: %s', msg.time);
                        that.rl.prompt();
                    });
                    break;
                case 'count':
                    send(countObj, (inData) => {
                        var msg = inData.msg;
                        // console.log(inData);
                        console.log('count response: %s', msg.count);
                        that.rl.prompt();
                    });
                    break;
                default:
                    try {
                        var parsed = JSON.parse(line);
                        send(parsed, (inData) => {
                            console.log({response: inData});
                            that.rl.prompt();
                        });
                    }
                    catch (err) {
                        console.log('JSON parse error %s', err);
                    }
            }
        })
    }
}

process.on('SIGTERM', function(err) {
    console.log(err);
    process.exit();
});


