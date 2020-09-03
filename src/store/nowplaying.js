const axios = require('axios');

import config from 'json5-loader!@/config.json5';

export default {
  state: {
    nowPlayingData: null,

    updateTimeoutID: undefined,
  },

  mutations: {
    SET_AUTH_PROP(state, { prop, value }) {
      state[prop] = value;
    },

    CLEAR_UPDATE_TIMEOUT(state) {
      clearTimeout(state.updateTimeoutID);
      state.updateTimeoutID = undefined;
    },
  },

  actions: {
    // Get data from API
    async getNowPlayingData({ rootGetters, commit }) {
      let responseData;
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/player', { headers: rootGetters.authHeader, });

        responseData = response.data;
      } catch (error) {
        console.log(error);
        responseData = null;
      }

      if (typeof responseData === 'object' && responseData !== null) {
        commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: responseData });
      } else {
        commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: null });
      }
    },

    // Set a timer for the next API request
    async startUpdateTimeout({ rootState, state, commit, dispatch }) {
      let timeoutLength;

      if (state.nowPlayingData !== null) {
        const calculated = (state.nowPlayingData.item.duration_ms -
            rootState.config.crossfade * 1000) -
          state.nowPlayingData.progress_ms;

        timeoutLength = Math.min(calculated + 1000, config.api.maxRequestInterval);
      } else {
        timeoutLength = config.api.maxRequestInterval;
      }

      const timeoutID = setTimeout(async () => {
        await dispatch('getNowPlayingData');
        await dispatch('startUpdateTimeout');
      }, timeoutLength);

      commit('SET_AUTH_PROP', { prop: 'updateTimeoutID', value: timeoutID });
    },
    
    async stopUpdateTimeout({ commit }) {
      commit('CLEAR_UPDATE_TIMEOUT');
    }
  },
};