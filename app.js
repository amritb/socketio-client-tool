var app = require('http').createServer()
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080);
console.log('Socket-io server running on 8080. ');
console.log('Emit to "socketio-client" for debugging.');

io.on('connection', function (socket) {
  socket.emit('message', { hello: 'world' });
  socket.on('socketio-client', function (data) {
    console.log('type: ', typeof(data), ' \ndata: ', data, '\n');
    socket.emit('socketio-client', data);
  });
});
