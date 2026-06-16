const nodeExternals = require('webpack-node-externals');
const { IgnorePlugin } = require('webpack');

module.exports = (options) => ({
  ...options,
  // Bundle @edgebook/* workspace packages inline so the compiled bundle can
  // resolve them without hoisted symlinks. ccxt is kept external — it's only
  // needed when exchange sync runs, which is disabled for now.
  externals: [
    nodeExternals({
      allowlist: [/^@edgebook\//],
    }),
  ],
  plugins: [
    ...(options.plugins ?? []),
    new IgnorePlugin({ resourceRegExp: /^http-proxy-agent$/ }),
    new IgnorePlugin({ resourceRegExp: /^socks-proxy-agent$/ }),
    new IgnorePlugin({ resourceRegExp: /^protobufjs/ }),
  ],
});
