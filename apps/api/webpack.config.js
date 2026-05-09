const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    // Bundle @edgebook/* workspace packages inline.
    // Everything else (real node_modules) stays external for faster builds.
    externals: [
      nodeExternals({
        allowlist: [/^@edgebook\//],
      }),
    ],
  };
};
