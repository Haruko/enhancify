// const path = require('path');

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],

  pluginOptions: {
    electronBuilder: {
      nodeModulesPath: ['./node_modules'],
      nodeIntegration: true,
      mainProcessWatch: ['src/ipc.js', 'src/config.json5', 'src/server'],
      builderOptions: {
        win: {
          icon: 'src/assets/icon.ico',
        },
      },
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