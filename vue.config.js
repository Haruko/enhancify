module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  pluginOptions: {
    electronBuilder: {
      nodeModulesPath: ['./node_modules'],
      nodeIntegration: true,
    },
  },
}