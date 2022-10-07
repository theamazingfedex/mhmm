const WebSocketServer = require('websocket').server;
const http = require('http');
const { debugLog } = require('../fs-server/helpers');

function createServer() {
  const server = http.createServer((request, response) => { });
  let numActiveConnections = 0;

  server.listen(4000);
  const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  })

  const originIsAllowed = (origin) => {
    console.log(`currentOrigin: '${origin}'`);
    return true;
  }

  let suicideTimeout = null;

  wsServer.on('request', function(request) {
    // debugLog('DevWebSocketServer got request: ', request);
    if(!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ` Connection from origin '${origin}' rejected. Not Allowed.`);
      return;
    }

    try {
      const connection = request.accept(null, request.origin);
      console.log((new Date()) + ` Connection accepted from origin '${request.origin}'.`);
      numActiveConnections++;
      if (suicideTimeout !== null) {
        clearTimeout(suicideTimeout);
      }

      connection.on('message', function(message) {
        if (message.type === 'utf8') {
          console.timeLog('Received Message: ', message.utf8Data);
          connection.sendUTF(message.utf8Data);
        }
      });

      connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ` disconnected because Reason: ${reasonCode} with Description: ${description}`);
        numActiveConnections--;

        if (numActiveConnections === 0) {
          suicideTimeout = setTimeout(() => {
            process.exit(1);
          }, 1 * 5 * 1000); // 5 seconds to reconnect before we burn the whole thing down
        }
      });
    } catch (e) {
      console.log(e);
    }
  });
}

// const ws = require('nodejs-websocket');

// function createServer() {
//   const server = ws.createServer(function (conn) {
//     console.log('New WebSocket connection')
//     conn.on("close", function(reasonCode, description) {
//         console.log((new Date()) + ' Peer ' + conn.remoteAddress + ` disconnected because Reason: ${reasonCode} with Description: ${description}`);
//     })
//   }).listen(4000);
// }

try {
  createServer();
  console.log('DevWebSocketServer is up and running...')
} catch (e) {
  console.log('DevWebSocketServer crashed with error: ', e);
}