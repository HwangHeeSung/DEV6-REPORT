const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const apiTarget = process.env.REACT_APP_API_PROXY_TARGET || 'http://localhost:8993';

  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
    })
  );
};
