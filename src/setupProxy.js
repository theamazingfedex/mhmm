const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware('/wsa', {
      target: 'ws://localhost:4000',
      ws: true,
      changeOrigin: false,
    })
  );
}