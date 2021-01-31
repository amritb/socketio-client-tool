'use strict';

let eventsToListen = ['message'];
let socket = {};
let disconnectedInterval = null;
let connectionTimeout = null;
let title = document.title;
let localdb = null;

const form = {
  url: '',
  path: '',
  options: null,
};

const CONNECTION_TIMEOUT_MS = 10 * 1000;

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


  $("#connect").on('submit',function(e) {
    const connectButton = $("#connect .btn");
    e.preventDefault();

    if (connectButton.html().trim() === 'Connect') {
      form.url = $("#socketUrl").val().trim();
      form.path = $("#socketPath").val().trim();
      form.options = $("#socketOptions").val().trim();

      try {
        form.options = (form.options ? JSON.parse(form.options) : null);
      } catch (err) {
        alert('Invalid JSON options: ' + err.message);
        return;
      }

      if (form.url === '') {
        alert('Invalid URL given');
        return;
      }

      const socketOptions = $.extend({}, {path: form.path}, form.options, {
        transports: ['websocket']
      });

      console.log('Connecting to: ' + form.url + ' with options: ' + JSON.stringify(socketOptions));

      setFormInputs(true, true);
      socket = io(form.url, socketOptions);

      connectionTimeout = setTimeout(function() {
        socket.close();
        socket = null;

        alert('Connection to ' + form.url + ' timed out!');
        setFormInputs(false, false);
      }, CONNECTION_TIMEOUT_MS);

      socket.on('connect', function () {
        clearTimeout(connectionTimeout);
        setFormInputs(true, false);
        setSocketDetails(socket);

        setHash();

        $("#submitEmit").prop('disabled', false);
        clearInterval(disconnectedInterval);
        document.title = title;
        $('.disconnected-alert').hide();
        $('.connected-alert').show().delay(5000).fadeOut(1000);
        $("#connectionPanel").prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span> Connected</p>');

        connectButton.html('Disconnect');
        connectButton.removeClass('btn-success');
        connectButton.addClass('btn-danger');
      });

      socket.on('disconnect', function (sock) {

        $("#submitEmit").prop('disabled', true);
        setFormInputs(false, false);
        setSocketDetails(null);

        $('#socketInfo span').text('');

        disconnectedInterval = setInterval(function () {
          if (document.title === "Disconnected") {
            document.title = title;
          } else {
            document.title = "Disconnected";
          }
        }, 800);

        $('.disconnected-alert').hide();
        $('.disconnected-alert').show();
        $("#connectionPanel").prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span> Disconnected --> ' + sock + '</p>');
        connectButton.html('Connect');
        connectButton.removeClass('btn-danger');
        connectButton.addClass('btn-success');
      });

      registerEvents();
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
    if (socket && socket.io) {
      var event = $("#emitData #event-name").val().trim();
      var data;
      if ($('#emitAsJSON').is(":checked")) {
        data = parseJSONForm();
      }
      if ($('#emitAsPlaintext').is(":checked")) {
        var text = $("#emitData #data-text").val().trim();
        try {
          data = JSON.parse(text);
        } catch (ex) {
          data = text;
        }
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


  $("#addNewJsonField").on('click', function(e) {
    e.preventDefault();
    var template = "<div class=\"form-inline\"><div class=\"form-group\"><input type=\"text\" class=\"form-control key\"></div> <div class=\"form-group\"><input type=\"text\" class=\"form-control value\"></div> <div class=\"form-group\"><select class=\"form-control type\"><option value=\"string\">String</option><option value=\"number\">Number</option><option value=\"boolean\">Boolean</option></select></div> <div class=\"form-group\"><button class=\"btn btn-xs btn-danger remove\" type=\"button\">remove</button></div></div>";
    $("#jsonData").append(template);
  });


  $("#jsonData").on('click', '.remove', function(e) {
    e.preventDefault();
    $(this).closest(".form-inline").remove();
  });


  $("#clearHistory").on('submit',function(e) {
    e.preventDefault();
    initDB(true);
    $('#emitHistoryPanels').empty();
  });


  processHash();
  initHistory();
});

function setFormInputs(disableForm, disableSubmit) {
  $("#connect input").prop('disabled', disableForm);
  $("#connect .btn").prop('disabled', disableSubmit);
}

function setSocketDetails(socket) {
  const socketInfo = $('#socketInfo');

  if (socket) {
    socketInfo.show();
    $('#socketInfo .well .details').append(`<div>Id: ${socket.id}</div><div>Connected: ${new Date()}</div>`);
  } else {
    socketInfo.hide();
    $('#socketInfo .well .details').html('');
  }
}

function setHash() {
  if (form.url !== '' && eventsToListen.length > 0) {
    const hashEvents = eventsToListen.slice();
    const messageIndex = hashEvents.indexOf('message');

    if (messageIndex !== -1) {
      hashEvents.splice(messageIndex, 1);
    }

    location.hash = 'url=' + window.btoa(form.url) + '&path=' + window.btoa(form.path) + '&opt=' + window.btoa(form.options ? JSON.stringify(form.options) : '') + '&events=' + hashEvents.join();
  }
}

function processHash() {
  let hash = location.hash.substr(1);
  hash = decodeURI(hash);

  if (hash.indexOf('url=') !== -1 && hash.indexOf('events=') !== -1) {
    const hashUrl = window.atob(hash.substr(hash.indexOf('url=')).split('&')[0].split('=')[1]);
    const hashPath = window.atob(hash.substr(hash.indexOf('path=')).split('&')[0].split('=')[1]);
    const hashOpt = window.atob(hash.substr(hash.indexOf('opt=')).split('&')[0].split('=')[1]);
    const hashEvents = hash.substr(hash.indexOf('events=')).split('&')[0].split('=')[1].split(',');

    $.merge(eventsToListen, hashEvents);
    $.each(hashEvents, function(index, value) {
      if (value !== '') {
        $('#eventPanels').prepend(makePanel(value));
      }
    });

    $('#socketUrl').val(hashUrl);
    $('#socketPath').val(hashPath);
    $('#socketOptions').val(hashOpt);

    $('#connect').submit();
  }
}

function registerEvents() {
  if (socket && socket.io) {
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
  var result = {};
  var formInputs = $('#jsonData').find('.form-inline');
  formInputs.each(function(index, el) {
    var key = $(el).find('.key').val().trim();
    if (!key.length) {
      return true;
    }
    var type = $(el).find('.type').val();
    if(type == "boolean"){
      result[key] = $(el).find('.value').val().toLowerCase() == "true";
    } else if(type == "number"){
      result[key] = parseInt($(el).find('.value').val());
    } else{
      result[key] = $(el).find('.value').val().trim();
    }
  });
  console.log("json to emit " + result);
  return result;
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
  const panel = $("#emitAckResPanels").find("[data-windowId='" + panelId + "']");
  if (panel.length === 0) {
    $('#emitAckResPanels').prepend(makePanel(panelId));
  }

  const emitData = {
    event: event,
    request: data,
    time: getFormattedNowTime()
  };

  socket.emit(event, data, function(res) {
    const elementToExtend = $("#emitAckResPanels").find("[data-windowId='" + panelId + "']");
    elementToExtend.prepend('<p><span class="text-muted">' + getFormattedNowTime() + '</span><strong> ' + JSON.stringify(res) + '</strong></p>');
  });
}

function addHistoryPanel(history) {
  var histPanelId = history.event;
  var panel = $("#emitHistoryPanels").find("[data-windowId='" + histPanelId + "']");
  if (panel.length === 0) {
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
