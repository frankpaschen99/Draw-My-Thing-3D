var io = require('socket.io')(9001);

io.on('connection', function(socket) {
  console.log(socket.id);
});
