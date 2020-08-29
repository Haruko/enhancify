import Vue from 'vue'
import Vuex from 'vuex'

import config from './config.js'
import nowplaying from './nowplaying.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {

  },

  mutations: {

  },

  actions: {

  },

  modules: {
    config,
    nowplaying,
  }
})