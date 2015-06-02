'use strict'

var eventsToListen = ['message'];
var socket = {};
var disconnectedInerval;
var title = document.title;

$(function () {
  $('.disconnected-alert, .connected-alert').hide();
  $('#eventPanels').prepend(makePanel('message'));

  $("#connect").submit(function (e) {
    e.preventDefault();
    var url = $("#connect input:first").val().trim();
    if(url === '') {
      console.error('Invalid URL given');
    } else {
      socket = io(url);
      socket.on('connect', function () {
        clearInterval(disconnectedInerval);
        document.title = title;
        $('.disconnected-alert').hide();
        $('.connected-alert').show().delay(5000).fadeOut(1000);
        $("#connectionPanel").prepend('<p><span class="text-muted">'+Date.now()+'</span> Connected</p>');
      });
      socket.on('disconnect', function (sock) {
        disconnectedInerval = setInterval(function(){
          if(document.title === "Disconnected") {
            document.title = title;
          } else {
            document.title = "Disconnected";
          }
        }, 800);
        $('.disconnected-alert').hide();
        $('.disconnected-alert').show();
        $("#connectionPanel").prepend('<p><span class="text-muted">'+Date.now()+'</span> Disconnected --> '+sock+'</p>');
      });
      registerEvents();
    }
  });

  $("#addListener").submit(function (e) {
    e.preventDefault();
    var event = $("#addListener input:first").val().trim();
    if(event !== '') {
      eventsToListen.push(event);
      $('#eventPanels').prepend(makePanel(event));
      $("#addListener input:first").val('');
      registerEvents();
    } else {
      console.error('Invalid event name');
    }
  });

  $("#emitData").submit(function (e) {
    console.log(socket);
    if(socket.io) {
      var event = $("#emitData #event-name").val().trim();
      var data = $("#emitData #data-text").val().trim();
      if(event !== '' && data !== '') {
        $('#emitData #event-name').val('');
        $("#emitData #data-text").val('');
        socket.emit(event, data);
        $('#emitDataModal').modal('toggle');
      } else {
        console.error('Emitter - Invalid event name or data');
      }
    } else {
      console.error('Emitter - not connected');
    }
    e.preventDefault();
  });

});

function registerEvents() {
  if(socket.io) {
    $.each(eventsToListen, function (index, value) {
      socket.on(value, function (data) {
        $("#panel-"+value+"-content").prepend('<p><span class="text-muted">'+Date.now()+'</span><strong> '+JSON.stringify(data)+'</strong></p>');
      });
    });
  }
}

function makePanel(event) {
  return '<div class="panel panel-primary" id="panel-'+event+'"> <div class="panel-heading"> <button type="button" class="btn btn-warning btn-xs pull-right" data-toggle="collapse" data-target="#panel-'+event+'-content" aria-expanded="false" aria-controls="panel-'+event+'-content">Toggle panel</button> <h3 class="panel-title">"'+event+'" Events</h3> </div> <div id="panel-'+event+'-content" class="panel-body"></div> </div>';
}
