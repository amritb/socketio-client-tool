import { useState } from "react";
import History from './history.jsx';
import { Form, Button, Col, Alert } from 'react-bootstrap';

export default function Listen({ listeners, addListener, listenHistory, clearHistory }) {

  const [channel, setChannel] = useState('');
  const [formValidation, setFormValidation] = useState([]);

  const getChannelMessages = (channel) => {
    return listenHistory.filter(item => channel === item.channel);
  }

  const listenerBoxes = listeners.map((item, index) => {
    return (
      <History key={index} data={getChannelMessages(item)} title={item} stack="listen" channels={[item]} clearHistory={clearHistory} />
    );
  });

  const onFormSubmit = (e) => {
    e.preventDefault();
    addListener([channel]);
    setChannel('');
  }

  const channelTextBoxChange = e => {
    setChannel(e.target.value.trim());
    setFormValidation(v => []);
    if (listeners.includes(e.target.value)) {
      setFormValidation(v => [...v, 'Event already exists']);
    }
  }

  return (
    <div>
      <div>
        <Alert variant="danger" show={(formValidation).length > 0}>
          {formValidation.join(', ')}
        </Alert>
        <Form onSubmit={onFormSubmit} noValidate validated={formValidation.length === 0}>
          <Form.Row className="mb-2">
            <Col>
              <Form.Control placeholder="listen to a new event..." value={channel} onChange={channelTextBoxChange} />
            </Col>
            <Col>
              <Button variant="success" type="submit" block disabled={formValidation.length !== 0 || channel.length < 1}>Add</Button>
            </Col>
          </Form.Row>
        </Form>
      </div>
      <h3>Listening to</h3>
      {listenerBoxes}
    </div>
  );
}