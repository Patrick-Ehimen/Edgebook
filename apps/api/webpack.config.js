const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  // Bundle @edgebook/* workspace packages inline.
  // ccxt is kept external to avoid bundling its optional deps (http-proxy-agent, etc.).
  externals: [
    { ccxt: 'commonjs ccxt' },
    nodeExternals({
      allowlist: [/^@edgebook\//],
    }),
  ],
});
