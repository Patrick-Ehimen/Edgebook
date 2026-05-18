const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  externals: [
    { ccxt: 'commonjs ccxt' },
    nodeExternals({
      allowlist: [/^@edgebook\//],
    }),
  ],
});
