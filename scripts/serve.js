const serveHandler = require("serve-handler");
const WebSocketServer = require('websocket').server;
const http = require('http');
const MhmmFileserver = require('../fs-server/index');
const { debugLog } = require('../fs-server/helpers');
const open = require('open');

function MhmmServer() {
  const server = http.createServer((request, response) => {
  return serveHandler(request, response, {
    public: './build',
    directoryListing: false,
    cleanUrls: true,
  })
  });

  server.listen(3000);

  let numActiveConnections = 0;

  const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  })

  const originIsAllowed = (origin) => {
    return origin === 'http://localhost:3000';
  }

  let suicideTimeout = null;

  wsServer.on('request', function(request) {
    debugLog('WebSocketServer got request: ', request);
    if(!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ` Connection from origin '${request.origin}' rejected. Not Allowed.`);
      return;
    }

    try {
      const connection = request.accept(null, request.origin);
      // if (connection.remoteAddress !== 'Peer ::1' && connection.remoteAddress !== '::1') {
      //   try {
      //     request.reject();
      //   } catch (e) {}
      //   console.log((new Date()) + ` Connection from peer '${connection.remoteAddress}' rejected. Not Allowed.`);
      //   return;
      // }
      console.log((new Date()) + ` Connection accepted for '${connection.remoteAddress}' from origin '${request.origin}'.`);

      numActiveConnections++;
      if (suicideTimeout !== null) {
        clearTimeout(suicideTimeout);
      }

      connection.on('message', function(message) {
        if (message.type === 'utf8') {
          console.log('Received Message: ', message.utf8Data);
          connection.sendUTF(message.utf8Data);
        }
      });

      connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ` disconnected with ReasonCode: ${reasonCode} with Description: ${description}`);
        numActiveConnections--;
        if (numActiveConnections === 0) {
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  WARNING  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          console.log('!!!!!!!!!!   Shutting Down MHMM Unless Connection Restored   !!!!!!!!!!');
          console.log('!!!!!!!!!!  5 Seconds to Reconnect to http://localhost:3000  !!!!!!!!!!');
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  WARNING  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

          suicideTimeout = setTimeout(() => {
            process.exit(1);
          }, 1 * 5 * 1000); // 5 seconds to reconnect before we burn the whole thing down
        }
      });
    } catch (e) {
      debugLog('WebSocketServer - error handling request:', ...e);
    }
  });

  console.log('Metal: Hellsinger Mod Manager now running on port 3000.\n==== Visit http://localhost:3000 to get started! ====');
  open('http://localhost:3000');
}

MhmmFileserver();
MhmmServer();
