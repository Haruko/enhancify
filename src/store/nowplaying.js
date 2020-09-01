const axios = require('axios');

export default {
  state: {
    nowPlayingData: null,

    nowPlayingText: null,

  },

  mutations: {
    SET_AUTH_PROP(state, { prop, value }) {
      state[prop] = value;
    },
  },

  actions: {
    async getNowPlayingData({ rootState, commit }) {
      console.log(rootState.auth.authHeader)
      let responseData;
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/player', { headers: rootState.auth.authHeader, });

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
  },
};