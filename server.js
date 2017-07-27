var net = require('net');

var server = net.createServer(function(socket) {
  socket.write('Echo server\r\n');
  socket.pipe(socket);
}).on('error', (err) => {
    throw err;
  });

server.listen(9432, '127.0.0.1');