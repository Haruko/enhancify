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

  },

  modules: {
    config,
    auth,
    nowplaying,
  }
})