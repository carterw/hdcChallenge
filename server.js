var net = require('net');

// var server = net.createServer(function(socket) {
//   socket.write('Echo server\r\n');
//   socket.pipe(socket);
// }).on('error', (err) => {
//     throw err;
//   });

// server.listen(9432, '127.0.0.1');

var server = net.createServer(function(socket) {
    console.log('client connected');

    socket.setEncoding('utf8');
    setInterval(function(){sendHeartbeat(socket); }, 1000);

    var welcome = {
      type:"welcome",
      msg: "Welcome ~~ Bill Carter!"
    }
    var str = JSON.stringify(welcome);
    socket.write(str);

    socket.on('error', (err) => {
      throw err;
    });

    socket.on('data', (incoming) => {
      // console.log(incoming);

      var inData = JSON.parse(incoming);
      console.log(inData);

      if ('request' in inData) {
        var id = inData.id;
        switch (inData.request) {
          case 'count':
            var msg = {reply: id, count: 20}
            var t = {type: 'msg', msg: msg};
            var str = JSON.stringify(t);
            socket.write(str);
            break;
          case 'time':
            var msg = {reply: id, random: 20, time: 'now'}
            var t = {type: 'msg', msg: msg};
            var str = JSON.stringify(t);
            socket.write(str);
          // {"sender":"worker","msg":{"random":28,"time":"Wed Jul 26 21:38:46 2017","reply":"af8c93d3-6871-47b1-b1cd-932a9421fa7e"},"date":"21:38/46","type":"msg"}
            break;
        }
      }

    });

    // socket.write('Echo server\r\n');
    // socket.pipe(socket);
  });

  function sendHeartbeat(socket) {
    var now = Date.now();
    var hb = {type: 'heartbeat', epoch: now}
    var str = JSON.stringify(hb);
    socket.write(str);
  }

  server.listen(9432, '127.0.0.1');