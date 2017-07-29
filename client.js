"use strict"

const net = require('net');
var uuid = require('uuid/v4');
var EventEmitter = require('events').EventEmitter;
const util = require('util');


var ChallengeClient = function() {
    var that = this;
    this.client = null;
    this.heartbeatSeen = 0;

    var _server = null;
    var _port = null;
    var _timeout= null;
    var _loginObj = null;
    var _debug = false;

    this.connect = function(args) {
        _server = args.server;
        _port = args.port;
        _timeout = args.timeout;
        _loginObj = args.loginObj;
        _debug = args.debug;

        _connect();
    }

    function _connect() {
        that.client = new net.Socket();
        that.client.setEncoding('utf8');

        _initHandlers();

        try {
            that.client.connect(_port, _server, function() {
                console.log('Connected');
    
                that.client.setTimeout(_timeout + 1);
                _startHeartbeatTimer(_timeout);
    
                that.emit('connected', '');
            });
        }
        catch (e) {
            console.log(e);
        }
    }

    function _checkConnected() {
        if (that.client != null) {
            var ra = that.client.remoteAddress;
            if (typeof ra != 'undefined')
                return true;
        }
        return false;
    }

    function _initHandlers() {

        that.client.on('close', () => {
            console.log('Client connection closed');
            _disConnect();
            _connect();
        });

        that.client.on('error', (e) => {
            console.log(e);
            that.emit('socketError', e)
        });

        that.client.on('timeout', () => {
            // _pdebug('socket timeout');
            _checkHeartbeat();
            that.emit('timedout', '');
        });

        that.client.on('data', (incoming) => {
            // _pdebug('Received: ' + incoming);
            // _pdebug('>>> end');

            var lines = incoming.split('\n');
            if (lines.length > 1){    
                for (var i in lines) {
                    lines[i] = lines[i].trim();
                    if (lines[i].length > 0)
                        _handleIncoming(lines[i])
                }
            }
            else
                _handleIncoming(incoming);
        });
    }

    function _handleIncoming(incoming) {
        try {
            var inData = JSON.parse(incoming);
        }
        catch (err) {
            // _pdebug(err);
            that.emit('dataParseError', err);
            return;
        }

        if ('type' in inData) {
            var type = inData.type;
            if (type == 'heartbeat') {
                that.heartbeatSeen = Date.now();
            }
            else if (type == 'msg') {
                if ('reply' in inData.msg) {
                    var cid = inData.msg.reply;
                    var callback = _cidChecker.checkCID(cid);
                    // _pdebug('cid ok ' + valid);
                    if (callback) {
                        callback(inData);                    
                    }
                }
            }
            that.emit(type, inData);
        }

    }

    function _disConnect() {
        _stopHeartbeatTimer();
        if (that.client) {
            that.client.end();
            that.client.destroy();
            that.client = null;
        }
    }

    // could make this take an array of send objects and loop
    // through them to build a string of '\n'-delimited messages
    this.send = (sendObj, callback) => {
        if (_checkConnected() != true)
            return; // could queue up sends?
        if (callback) {
            var cid = _cidChecker.putCID(callback);
            sendObj.id = cid;
        }
        _pdebug('sending: ');
        _pdebug(sendObj);
        var sendData = JSON.stringify(sendObj);
        that.client.write(sendData);
    }

    function _checkHeartbeat() {
        var now = Date.now();
        var thbs = that.heartbeatSeen;
        if ( (now - that.heartbeatSeen) > 2000) {
            // _pdebu.log('heartbeat timed out');
            _disConnect();
        }
    }

    var intervalID = null;
    function _startHeartbeatTimer(timeout) {
        intervalID = setInterval(function(){ _checkHeartbeat(); }, timeout);
    }
    
    function _stopHeartbeatTimer() {
        if (intervalID != null) {
            clearInterval(intervalID);
            intervalID = null;
        }
        that.heartbeatSeen = 0;
    }

    function _pdebug(msg) {
        if (_debug) {
            console.log(msg);
        }
    }

    var _cidChecker = new CidChecker();
}

var CidChecker = function() {
    var cids = {};

    this.putCID = (callback) => {
        var cid = uuid();
        cids[cid] = callback;
        return(cid);
    }

    this.checkCID = (cid) => {
        if (cid in cids) {
            var callback = cids[cid];
            delete cids[cid];
            return callback;
        }
        else
            return null;
    }

}

// extend the EventEmitter class using our ChallengeClient class
util.inherits(ChallengeClient, EventEmitter);
module.exports.ChallengeClient = ChallengeClient;
