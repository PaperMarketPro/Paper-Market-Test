import WS from 'ws';

const ws = new WS('ws://localhost:3000/api/ws');

ws.on('open', () => {
  console.log('WS Connection successfully opened!');
});

ws.on('message', (data) => {
  console.log('Received message:', data.toString());
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});

ws.on('close', (code, reason) => {
  console.log(`WS Closed: ${code} - ${reason.toString()}`);
});

setTimeout(() => {
  ws.close();
}, 5000);
