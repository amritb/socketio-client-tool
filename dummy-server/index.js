var server = require('http').createServer()
var io = require('socket.io')(server, {
  cors: {
    origin: "*"
  }
});

console.log('Socket-io server running on 8080.');
console.log('Emit to "socketio-client" or "socketio-client-ack" for debugging.');


io.on('connection', function (socket) {
  socket.emit('message', { hello: 'world' });
  socket.on('socketio-client', function (data) {
    console.log('type: ', typeof (data), ' \ndata: ', data, '\n');
    socket.emit('socketio-client', data);
  });
  socket.on('socketio-client-ack', (data, fn) => {
    console.log('on socketio-client-ack: ', data);
    fn(data);
  });

  socket.on('teste-room', (data) => {
    io.to('room1').emit('eventRoom', data);
  });

  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
 });

  io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
  });

  io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has exited room ${room}`);
  });

 
});

server.listen(8080);