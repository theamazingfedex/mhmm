import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import reportWebVitals from './reportWebVitals';
import App from './App';

let ws = new WebSocket('ws://localhost:3000/wsa');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();

ws.onopen = () => {
  console.log('!?! WebSocket Connected');
}
ws.onmessage = (event) => {
  console.log('!?! Received message: ', event.data);
}
ws.onclose = () => {
  console.log('!?! WebSocket Connection Closed');
}
