module.exports = {
  publicPath: '',
  parallel: false,
  configureWebpack: (config) => {
    config.resolve.alias.tinyqueue =
      __dirname + '/node_modules/tinyqueue/tinyqueue.js';
  },

  chainWebpack: (config) => {
    config.module.rule('worker')
      .test(/\.worker\.js$/i)
      .use('worker-loader')
      .loader('worker-loader')
      .options({ name: '[name].[hash].js' })
      .end()
  },
  // configureWebpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.worker\.js$/,
  //     use: { loader: 'worker-loader' }
  //   });
  //   // config.resolve.alias.tinyqueue = __dirname + '/node_modules/tinyqueue/tinyqueue.js';
  // },
}
