import { Button, ListGroup } from 'react-bootstrap'
import { Col, Row, Badge } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';

export default function History({ data, title, stack, channels, clearHistory, emitBack }) {
  const emitButtonClick = (e, item) => {
    if (typeof emitBack === 'function') {
      emitBack(item.channel, item.data);
    }
  }

  const items = data.map((item) => {
    return (
      <ListGroup.Item key={item.date.toISOString() + '--' + item.channel}>
        <Row>
          <Col sm={4}>
            <small>{item.date.toLocaleTimeString()}</small> <br /> <Badge variant="info">{item.channel}</Badge>
          </Col>
          <Col>
            <div className="float-right">
              <Button className={typeof emitBack !== 'function' ? 'd-none': ''} size="sm" variant="warning" onClick={e => emitButtonClick(e, item)}>emit</Button>
            </div>
            <pre>{typeof item.data === "string" ? item.data : JSON.stringify(item.data, null, 2)}</pre>
          </Col>
        </Row>
      </ListGroup.Item>
    );
  });

  const clearHistoryClick = (e) => {
    clearHistory(stack, channels);
  }

  return (
    <div>
      <div className="mt-4 histories">
        <h3>
          {title}
          <Button size="sm" onClick={clearHistoryClick} className={items.length > 0 ? "ml-2 " : "d-none" } variant="danger"><BsTrash className="mr-2" />clear</Button>
          </h3>
        <ListGroup variant="flush rounded text-white">
          {items}
        </ListGroup>
      </div>
    </div>
  );
}