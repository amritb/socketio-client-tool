'use strict';

var eventsToListen = ['message'];
var socket = {};
var disconnectedInerval;
var url = '';
var options = '';
var title = document.title;
var localdb = null;

$(function() {
  $('#jsonData').hide();
  $('.emitted-msg').hide();
  $('.emitted-failure-msg').hide();
  $('.listen-failure-msg').hide();
  $('.listen-added-msg').hide();
  $('.disconnected-alert, .connected-alert').hide();
  $('#eventPanels').prepend(makePanel('message'));
  $('input[type=radio][name=emitAs]').change(function() {
    if (this.value === 'JSON') {
      $('#plainTextData').hide();
      $('#jsonData').show();
    }
    if (this.value === 'plaintext') {
      $('#plainTextData').show();
      $('#jsonData').hide();
    }
  });

  $("#connect").submit(function(e) {
    e.preventDefault();
    if ($("#connect .btn").html().trim() === 'Connect') {
      url = $("#connect input:first").val().trim();
      options = $("#connect_options").val().trim();
      var opt = options ? JSON.parse(options) : null;
      if (url === '') {
        console.error('Invalid URL given');
      } else {
        socket = io(url, $.extend({}, opt, {
          transports: ['websocket']
        }));
        setHash();
        socket.on('connect', function() {
          $("#submitEmit").prop('disabled', false);
          clearInterval(disconnectedInerval);
          document.title = title;
          $('.disconnected-alert').hide();
          $('.connected-alert').show().delay(5000).fadeOut(1000);
          $("#connectionPanel").prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span> Connected</p>');
          $("#connect .btn").html('Disconnect');
          $("#connect .btn").removeClass('btn-success');
          $("#connect .btn").addClass('btn-danger');
          $("#connect input").prop('disabled', true);
        });
        socket.on('disconnect', function(sock) {
          $("#submitEmit").prop('disabled', true);
          disconnectedInerval = setInterval(function() {
            if (document.title === "Disconnected") {
              document.title = title;
            } else {
              document.title = "Disconnected";
            }
          }, 800);
          $('.disconnected-alert').hide();
          $('.disconnected-alert').show();
          $("#connectionPanel").prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span> Disconnected --> ' + sock + '</p>');
          $("#connect .btn").html('Connect');
          $("#connect .btn").removeClass('btn-danger');
          $("#connect .btn").addClass('btn-success');
          $("#connect input").prop('disabled', false);
        });
        registerEvents();
      }
    } else {
      socket.disconnect();
    }
  });

  $("#addListener").submit(function(e) {
    e.preventDefault();
    var event = $("#addListener input:first").val().trim();
    if (event.length !== 0 && eventsToListen.indexOf(event) === -1) {
      eventsToListen.push(event);
      $('#eventPanels').prepend(makePanel(event));
      $("#addListener input:first").val('');
      setHash();
      registerEvents();
      $('.listen-added-msg').show().delay(1000).fadeOut(1000);
    } else {
      $('.listen-failure-msg').show().delay(1500).fadeOut(1000);
      console.error('Invalid event name');
    }
  });

  $("#emitData").submit(function(e) {
    if (socket.io) {
      var event = $("#emitData #event-name").val().trim();
      var data;
      if ($('#emitAsJSON').is(":checked")) {
        data = parseJSONForm();
      }
      if ($('#emitAsPlaintext').is(":checked")) {
        data = $("#emitData #data-text").val().trim();
      }
      if (event !== '' && data !== '') {
        var emitData = {
          event: event,
          request: data,
          time: getFormattedNowTime()
        };
        postDataIntoDB(emitData);
        addHistoryPanel(emitData);
        emit(event, data, 'emitAck-' + event);
        $('.emitted-msg').show().delay(700).fadeOut(1000)
      } else {
        $('.emitted-failure-msg').show().delay(700).fadeOut(1000);
        console.error('Emitter - Invalid event name or data');
      }
    } else {
      console.error('Emitter - not connected');
    }
    e.preventDefault();
  });

  $("#addNewJsonField").click(function(e) {
    e.preventDefault();
    var template = "<div class=\"form-inline\"><div class=\"form-group\"><input type=\"text\" class=\"form-control key\"></div> <div class=\"form-group\"><input type=\"text\" class=\"form-control value\"></div> <div class=\"form-group\"><button class=\"btn btn-xs btn-danger remove\" type=\"button\">remove</button></div></div>";
    $("#jsonData").append(template);
  });

  $("#jsonData").on('click', '.remove', function(e) {
    e.preventDefault();
    $(this).closest(".form-inline").remove();
  });


  $("#clearHistory").submit(function(e) {
    e.preventDefault();
    initDB(true);
    $('#emitHistoryPanels').empty();
  });


  processHash();
  initHistory();
});

function setHash() {
  if (url !== '' && eventsToListen.length > 0) {
    var hashEvents = eventsToListen.slice();
    var messageIndex = hashEvents.indexOf('message');
    if (messageIndex !== -1) {
      hashEvents.splice(messageIndex, 1);
    }
    location.hash = "url=" + window.btoa(url) + "&opt=" + window.btoa(options) + "&events=" + hashEvents.join();
  }
}

function processHash() {
  var hash = location.hash.substr(1);
  if (hash.indexOf('url=') !== -1 && hash.indexOf('events=') !== -1) {
    var hashUrl = window.atob(hash.substr(hash.indexOf('url=')).split('&')[0].split('=')[1]);
    var hashOpt = window.atob(hash.substr(hash.indexOf('opt=')).split('&')[0].split('=')[1]);
    var hashEvents = hash.substr(hash.indexOf('events=')).split('&')[0].split('=')[1].split(',');
    $.merge(eventsToListen, hashEvents);
    $.each(hashEvents, function(index, value) {
      if (value !== '') {
        $('#eventPanels').prepend(makePanel(value));
      }
    });
    $('#connect input:first').val(hashUrl);
    $('#connect_options').val(hashOpt);
    $('#connect').submit();
  }
}

function registerEvents() {
  if (socket.io) {
    $.each(eventsToListen, function(index, value) {
      socket.on(value, function(data) {
        if (!data) {
          data = '-- NO DATA --'
        }
        var elementToExtend = $("#eventPanels").find("[data-windowId='" + value + "']");
        elementToExtend.prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span><strong> ' + JSON.stringify(data) + '</strong></p>');
      });
    });
  }
}

function clearEvents(event) {
  if (event === 'connectionPanel') {
    $('#connectionPanel').empty();
  } else {
    $('#eventPanels').find("[data-windowId='" + event + "']").empty();
  }
}

function clearAllEvents() {
  $('#eventPanels').find('.panel-body')
    .each(function() {
      $(this).empty();
    });
}

function parseJSONForm() {
  var result = "{";
  var formInputs = $('#jsonData').find('.form-inline');
  formInputs.each(function(index, el) {
    var key = $(el).find('.key').val().trim();
    if (!key.length) {
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
  return `
    <div class="panel panel-primary">
      <div class="panel-heading">
        <button type="button" class="btn btn-warning btn-xs pull-right" data-toggle="collapse" data-target="#panel-` + event + `-content" aria-expanded="false" aria-controls="panel-` + event + `-content">Toggle panel</button>
        <button type="button" class="btn btn-warning btn-xs pull-right" onclick="clearEvents('` + event + `')">Clear Events</button>
        <h3 class="panel-title">On "` + event + `" Events</h3>
      </div>
      <div data-windowId="` + event + `" class="panel-body collapse in" id="panel-` + event + `-content">
      </div>
    </div>`;
}

function getFormattedNowTime() {
  var now = new Date();
  return now.getHours() + ":" +
    now.getMinutes() + ":" +
    now.getSeconds() + ":" +
    now.getMilliseconds();
}

function initDB(clear) {
  var dbName = 'socketioClientDB';
  if (clear) {
    localdb.destroy().then(function() {
      localdb = new PouchDB(dbName);
    });
  } else {
    localdb = new PouchDB(dbName);
  }
}

function initHistory() {
  initDB(false);
  var ddoc = {
    _id: '_design/index',
    views: {
      index: {
        map: function mapFun(doc) {
          emit(doc._id, doc);
        }.toString()
      }
    }
  };
  localdb.put(ddoc).catch(function(err) {
    if (err.name !== 'conflict') {
      throw err;
    }
  }).then(function() {
    return localdb.query('index', {
      descending: true,
      limit: 20
    });
  }).then(function(result) {
    var rows = result.rows;
    for (var i in rows) {
      var history = rows[i].value;
      addHistoryPanel(history);
    }
  }).catch(function(err) {
    console.log(err);
  });
}

function postDataIntoDB(data, callback) {
  if (localdb == null) {
    localdb = new PouchDB("socketioClientDB");
  }
  localdb.post(data).then(callback);
}

function emit(event, data, panelId) {
  console.log('Emitter - emitted: ' + data);
  var panel = $("#emitAckResPanels").find("[data-windowId='" + panelId + "']");
  if (panel.length == 0) {
    $('#emitAckResPanels').prepend(makePanel(panelId));
  }
  var emitData = {
    event: event,
    request: data,
    time: getFormattedNowTime()
  };
  socket.emit(event, data, function(res) {
    var elementToExtend = $("#emitAckResPanels").find("[data-windowId='" + panelId + "']");
    elementToExtend.prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span><strong> ' + JSON.stringify(res) + '</strong></p>');
  });
}

function addHistoryPanel(history) {
  var histPanelId = history.event;
  var panel = $("#emitHistoryPanels").find("[data-windowId='" + histPanelId + "']");
  if (panel.length == 0) {
    $('#emitHistoryPanels').prepend(makePanel(histPanelId));
  }
  var elementToExtend = $("#emitHistoryPanels").find("[data-windowId='" + histPanelId + "']");
  var historyContent = $('#historyContent').text();
  var id = 'hist-' + new Date().getTime();
  historyContent = historyContent.split('[[id]]').join(id);
  historyContent = historyContent.split('[[time]]').join(history.time);
  historyContent = historyContent.split('[[reqData]]').join(JSON.stringify(history.request));
  historyContent = historyContent.split('[[event]]').join(history.event);
  elementToExtend.prepend(historyContent);
  $("#form" + id).submit(function(e) {
    e.preventDefault();
    var id = $(this).find('[name="historyId"]').val();
    var data = JSON.parse($(this).find('[name="reqData"]').val());
    var event = $(this).find('[name="event"]').val();
    if (socket.io) {
      if (event !== '' && data !== '') {
        emit(event, data, 'emitAck-' + event);
        $('.emitted-msg-' + id).show().delay(700).fadeOut(1000)
      } else {
        $('.emitted-failure-msg-' + id).show().delay(700).fadeOut(1000);
        console.error('Emitter - Invalid event name or data');
      }
    } else {
      $('.emitted-failure-msg-' + id).show().delay(700).fadeOut(1000);
      console.error('Emitter - not connected');
    }
  });
}
