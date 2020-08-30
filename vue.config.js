// const path = require('path');

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],

  pluginOptions: {
    electronBuilder: {
      nodeModulesPath: ['./node_modules'],
      nodeIntegration: true,

      // builderOptions: {
      //   extraResources: ['src/config.json'],
      // },
    },
  },
  
  // configureWebpack: {
  //   devServer: {
  //     watchOptions: {
  //       ignored: [
  //         '**/dist_electron/**',
  //         '**/node_modules/**',
  //         '**/public/config.json',
  //         '**/public/refreshtoken.token'
  //       ],
  //     },
  //   },
  // },
}