// global __static
// const path = require('path');

import Vue from 'vue'
import Vuex from 'vuex'

import config from './config.js'
import auth from './auth.js'
import nowplaying from './nowplaying.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {

  },

  mutations: {

  },

  actions: {

  },

  getters: {
    // publicPath() {
    //   const isBuild = process.env.NODE_ENV === 'production'
    //   const publicPath = path.join(
    //     (isBuild ? __dirname : __static),
    //     (isBuild ? '../../' : '')
    //   );
      
    //   return publicPath;
    // },
  },

  modules: {
    config,
    auth,
    nowplaying,
  }
})