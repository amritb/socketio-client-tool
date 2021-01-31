import History from './history.jsx';

export default function Ack({ ackHistory, clearHistory }) {
  return (
    <History data={ackHistory} title="Messages" stack="ack" clearHistory={clearHistory} />
  );
}