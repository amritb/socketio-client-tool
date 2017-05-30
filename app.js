var app = require('http').createServer()
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080);

io.on('connection', function (socket) {
  socket.emit('message', { hello: 'world' });
  socket.on('socketio-client', function (data) {
    console.log(data);
  });
});
