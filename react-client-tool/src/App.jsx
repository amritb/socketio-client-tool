import './App.css';
import Connection from './components/connection.jsx';
import Listen from './components/listen.jsx';
import Emitter from './components/emitter.jsx';
import Ack from './components/ack.jsx';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Container, Row, Col, Modal, Tabs, Tab } from 'react-bootstrap';
import { MdCloudDone, MdCloudOff } from 'react-icons/md';



function App() {

  const [connData, setConnData] = useState({
    connected: false,
    loading: false,
    server: 'http://localhost:8080',
    config: '{"path": "/socket.io", "forceNew": true, "reconnectionAttempts": 3, "timeout": 2000}',
    errors: []
  });

  const [appConfig, setAppConfig] = useState(0);
  const [eventsToListenFor, setEventsToListenFor] = useState(['socketio-client', 'message']);

  const [listenTo, setListenTo] = useState([]);
  const [emitTo, setEmitTo] = useState(['socketio-client', 'socketio-client-ack']);

  // Storage
  const [emitHistory, setEmitHistory] = useState([]);
  const [listenHistory, setListenHistory] = useState([]);
  const [ackHistory, setAckHistory] = useState([]);

  const createConnection = (url, config) => {
    setConnData(() => {
      return {
        connected: false,
        loading: true,
        socketId: 'connecting..',
        server: url,
        config: config,
        errors: []
      }
    });

    window.iosocket = io(url, JSON.parse(config));

    window.iosocket.on("connect", () => {
      setConnData(() => {
        return {
          connected: true,
          loading: false,
          server: url,
          socketId: window.iosocket.id,
          config: config,
          errors: []
        }
      });
      eventsToListenFor.map(item => addListener(item));
    });

    window.iosocket.on('disconnect', (reason) => {
      console.log("on disconnect", reason);
    });


    // window.iosocket.on("connect_error", (error) => {
    //   console.log('connect_error', error);
    //   setConnData(() => {
    //     return {
    //       connected: false,
    //       loading: false,
    //       server: url,
    //       config: config,
    //       errors: [error]
    //     }
    //   });
    // });

  }

  function addListener(channel) {
    if (listenTo.includes(channel)) {
      return;
    }
    setListenTo(items => [channel, ...items]);
    window.iosocket.on(channel, (response) => {
      console.log("data received", channel, response);
      const d = new Date();
      const data = {
        key: d.toLocaleString(),
        date: d,
        channel: channel,
        data: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        dataType: typeof response === 'string' ? 'string' : 'json'
      };
      setListenHistory(i => [data, ...i]);
    });
  }

  const addEmitTo = (channel) => {
    setEmitTo((items) => [channel, ...items]);
  }

  const emitData = (emitChannel, dataToEmit) => {
    window.iosocket.emit(emitChannel, dataToEmit, (ack) => {
      const date = new Date();
      const store = {
        key: date.toUTCString(),
        channel: emitChannel,
        date: date,
        data: ack,
        type: typeof ack === 'string' ? 'string' : 'json'
      }
      setAckHistory(items => [store, ...items]);
    });
    const date = new Date();
    const store = {
      key: date.toUTCString(),
      channel: emitChannel,
      date: date,
      data: dataToEmit,
      type: typeof dataToEmit === 'string' ? 'string' : 'json'
    }
    setEmitHistory(items => [store, ...items]);
  }

  // const histryStackChannelsFilter = (item, channels) => {
  //   return !channels.includes(item.channel);
  // }

  function clearHistory(stack, channels) {
    switch (stack) {
      case 'emit':
        setEmitHistory(() => []);
        break;
      case 'listen':
        setListenHistory(items => items.filter(i => !channels.includes(i.channel)));
        break;
      case 'ack':
        setAckHistory(() => []);
        break;
      default:
        break;
    }
  }

  useEffect(() => {

    function setHash() {
      const hashObj = {
        server: connData.server,
        listen: listenTo,
        emit: emitTo,
        config: connData.config
      };
      window.location.hash = window.btoa(JSON.stringify(hashObj));
    }

    function getHash() {
      return window.location.hash === "" ? false : JSON.parse(window.atob(window.location.hash.split("#")[1]));
    }

    if (connData.connected) {
      setHash();
    } else {
      const d = getHash();

      if (d !== false && appConfig === 0) { // Has hash value on load
        setAppConfig(() => 1);
        if (d.listen.length > 0) {
          setEventsToListenFor(() => d.listen);
        }
        setEmitTo(() => d.emit);
        setConnData(() => {
          return {
            connected: false,
            loading: false,
            server: d.server,
            config: d.config,
            errors: []
          };
        });
      }
    }
  }, [connData.connected, connData.server, connData.config, listenTo, emitTo, appConfig]);

  return (
    <div className="App">
      <Container>
        <Row>
          <Col className="text-right">
            <span className="small">
              ID: <b>{connData.socketId}</b> Server: <b>{connData.server}</b>
            </span>
            {connData.connected ? <MdCloudDone className="text-success ml-3 h3" /> : <MdCloudOff className="text-danger mx-2 h3" />}
          </Col>
        </Row>

        <Row>
          <Col>
            <Tabs defaultActiveKey="listen" className="mb-4 nav-fillx">
              <Tab eventKey="listen" title="Listen">
                <Listen listeners={listenTo} addListener={addListener} listenHistory={listenHistory} clearHistory={clearHistory} stack="listen" />

              </Tab>

              <Tab eventKey="emit" title="Emit">
                <Emitter emitToChannels={emitTo} addEmitTo={addEmitTo} emitData={emitData} emitHistory={emitHistory} clearHistory={clearHistory} stack="emit" />
              </Tab>

              <Tab eventKey="ack" title="Ack">
                <Ack ackHistory={ackHistory} stack="ack" clearHistory={clearHistory} />
              </Tab>

            </Tabs>
          </Col>
        </Row>
      </Container>


      <Modal show={!(connData.connected)} backdrop="static" centered size="lg">

        <Modal.Header>
          <Modal.Title>
            Configure connection
            </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Connection eventsToListenFor={eventsToListenFor} emitTo={emitTo} connData={connData} createConnection={createConnection} />
        </Modal.Body>
      </Modal>
    </div >
  );
}

export default App;
