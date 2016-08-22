'use strict';

var eventsToListen = ['message'];
var socket = {};
var disconnectedInerval;
var url = '';
var title = document.title;

$(function () {
  $('#jsonData').hide();
  $('.emitted-msg').hide();
  $('.emitted-failure-msg').hide();
  $('.disconnected-alert, .connected-alert').hide();
  $('#eventPanels').prepend(makePanel('message'));
  $('input[type=radio][name=emitAs]').change(function () {
    if (this.value === 'JSON') {
      $('#plainTextData').hide();
      $('#jsonData').show();
    }
    if (this.value === 'plaintext') {
      $('#plainTextData').show();
      $('#jsonData').hide();
    }
  });

  $("#connect").submit(function (e) {
    e.preventDefault();
    url = $("#connect input:first").val().trim();
    if(url === '') {
      console.error('Invalid URL given');
    } else {
      socket = io(url, {transports: ['websocket']});
      setHash();
      socket.on('connect', function () {
        $("#submitEmit").prop('disabled', false);
        clearInterval(disconnectedInerval);
        document.title = title;
        $('.disconnected-alert').hide();
        $('.connected-alert').show().delay(5000).fadeOut(1000);
        $("#connectionPanel").prepend('<p><span class="text-muted">'+getFormattedNowTime()+'</span> Connected</p>');
      });
      socket.on('disconnect', function (sock) {
        $("#submitEmit").prop('disabled', true);
        disconnectedInerval = setInterval(function(){
          if(document.title === "Disconnected") {
            document.title = title;
          } else {
            document.title = "Disconnected";
          }
        }, 800);
        $('.disconnected-alert').hide();
        $('.disconnected-alert').show();
        $("#connectionPanel").prepend('<p><span class="text-muted">'+getFormattedNowTime()+'</span> Disconnected --> '+sock+'</p>');
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
      setHash();
      registerEvents();
    } else {
      console.error('Invalid event name');
    }
  });

  $("#emitData").submit(function (e) {
    if(socket.io) {
      var event = $("#emitData #event-name").val().trim();
      var data;
      if($('#emitAsJSON').is(":checked")){
          data = parseJSONForm();
      }
      if($('#emitAsPlaintext').is(":checked")){
          data = $("#emitData #data-text").val().trim();
      }
      if(event !== '' && data !== '') {
        console.log('Emitter - emitted: '+data);
        socket.emit(event, data);
        $('.emitted-msg').show().delay(700).fadeOut(1000)
      } else {
        $('.emitted-failure-msg').show().delay(700).fadeOut(1000)
        console.error('Emitter - Invalid event name or data');
      }
    } else {
      console.error('Emitter - not connected');
    }
    e.preventDefault();
  });

  $("#addNewJsonField").click(function (e) {
    e.preventDefault();
    var template = "<div class=\"form-inline\"><div class=\"form-group\"><input type=\"text\" class=\"form-control key\"></div> <div class=\"form-group\"><input type=\"text\" class=\"form-control value\"></div> <div class=\"form-group\"><button class=\"btn btn-xs remove\" type=\"button\" class=\"btn\">remove</button></div></div>";
    $("#jsonData").append(template);
  });

  $("#jsonData").on('click', '.remove', function (e) {
    e.preventDefault();
    $(this).closest(".form-inline").remove();
  });


  processHash();
});

function setHash() {
  if(url !== '' && eventsToListen.length > 0) {
    var hashEvents = eventsToListen.slice();
    var messageIndex = hashEvents.indexOf('message');
    if(messageIndex !== -1) {
      hashEvents.splice(messageIndex, 1);
    }
    location.hash = "url="+window.btoa(url)+"&events="+hashEvents.join();
  }
}

function processHash () {
  var hash = location.hash.substr(1);
  if(hash.indexOf('url=') !== -1 && hash.indexOf('events=')  !== -1) {
    var hashUrl = window.atob(hash.substr(hash.indexOf('url=')).split('&')[0].split('=')[1]);
    var hashEvents = hash.substr(hash.indexOf('events=')).split('&')[0].split('=')[1].split(',');
    $.merge(eventsToListen, hashEvents);
    $.each(hashEvents, function (index, value) {
      $('#eventPanels').prepend(makePanel(value));
    });
    $('#connect input:first').val(hashUrl);
    $('#connect').submit();
  }
}

function registerEvents() {
  if(socket.io) {
    $.each(eventsToListen, function (index, value) {
      socket.on(value, function (data) {
        if(!data) {
            data = '-- NO DATA --'
        }
        $("#panel-"+value+"-content").prepend('<p><span class="text-muted">'+getFormattedNowTime()+'</span><strong> '+JSON.stringify(data)+'</strong></p>');
      });
    });
  }
}

function parseJSONForm() {
    var result = "{";
    var formInputs = $('#jsonData').find('.form-inline');
    formInputs.each(function (index, el) {
        var key = $(el).find('.key').val().trim();
        if(!key.length){
         return true;
        }
        result += "\"" + key + "\"";
        result += (" : ");
        result += "\"" + ($(el).find('.value').val().trim()) + "\"";
        result += ",";
    });
    result = result.slice(0, -1);
    result += "}";
    console.log("json to emit " + result);
    return JSON.parse(result);
}

function makePanel(event) {
  return '<div class="panel panel-primary" id="panel-'+event+'"> <div class="panel-heading"> <button type="button" class="btn btn-warning btn-xs pull-right" data-toggle="collapse" data-target="#panel-'+event+'-content" aria-expanded="false" aria-controls="panel-'+event+'-content">Toggle panel</button> <h3 class="panel-title">On "'+event+'" Events</h3> </div> <div id="panel-'+event+'-content" class="panel-body"></div> </div>';
}

function getFormattedNowTime() {
    var now = new Date();
    return now.getHours() + ":" +
        now.getMinutes() + ":" +
        now.getSeconds() + ":" +
        now.getMilliseconds();
}
