const nodeExternals = require('webpack-node-externals');
const { IgnorePlugin } = require('webpack');

module.exports = (options) => ({
  ...options,
  // Bundle @edgebook/* workspace packages and ccxt inline.
  // ccxt is pure JS but requires optional native deps for proxy + dYdX support.
  // We don't use those features, so IgnorePlugin silences the missing-module errors.
  externals: [
    nodeExternals({
      allowlist: [/^@edgebook\//, /^ccxt/],
    }),
  ],
  plugins: [
    ...(options.plugins ?? []),
    new IgnorePlugin({ resourceRegExp: /^http-proxy-agent$/ }),
    new IgnorePlugin({ resourceRegExp: /^socks-proxy-agent$/ }),
    new IgnorePlugin({ resourceRegExp: /^protobufjs/ }),
  ],
});
