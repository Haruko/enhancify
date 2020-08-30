const pkce = require('pkce');
const axios = require('axios');
const qs = require('querystring');

import { ipcRenderer } from 'electron';

export default {
  state: {
    access_token: undefined,
    token_type: undefined,
    expires_in: undefined,

    refresh_token: undefined,

    port: 8080,
    scope: 'user-read-playback-state',

    // state: undefined,
    // codePair: undefined,
    state: pkce.createChallenge(),
    codePair: pkce.create(),
  },

  mutations: {
    SET_CODE_STATE(state, newState) {
      state.state = newState;
    },

    SET_CODE_PAIR(state, codePair) {
      state.codePair = codePair;
    },

    SET_ACCESS_TOKEN(state, token) {
      state.access_token = token;
    },

    SET_REFRESH_TOKEN(state, token) {
      state.refresh_token = token;
    },

    SET_TOKEN_TYPE(state, token) {
      state.token_type = token;
    },

    SET_EXPIRES_IN(state, token) {
      state.expires_in = token;
    },
  },

  actions: {
    // Load state and codePair from localStorage
    async loadFromLocalStorage({ commit }) {
      const localState = localStorage.state;
      const localCodePair = {
        codeChallenge: localStorage.codeChallenge,
        codeVerifier: localStorage.codeVerifier,
      };

      commit('SET_CODE_STATE', localState);
      commit('SET_CODE_PAIR', localCodePair);
    },

    // Save state and codePair to localStorage
    async saveToLocalStorage({ state }) {
      localStorage.state = state.state;
      localStorage.codeChallenge = state.codePair.codeChallenge;
      localStorage.codeVerifier = state.codePair.codeVerifier;
    },

    // Remove state and codePair from localStorage
    async clearLocalStorage() {
      localStorage.removeItem('state');
      localStorage.removeItem('codeChallenge');
      localStorage.removeItem('codeVerifier');
    },

    async requestAccessToken({ state, rootState, getters, commit, dispatch }, authCode) {
      let reqData;

      if (typeof authCode === 'undefined') {
        // Means this isn't from the callback so we have authed before
        reqData = {
          grant_type: 'refresh_token',
          refresh_token: state.refresh_token,
          client_id: rootState.config.client_id,
        };
      } else {
        // Means this is from the callback so we need to compare state and get the auth code
        reqData = {
          client_id: rootState.config.client_id,
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: getters.redirect_uri,
          code_verifier: state.codePair.codeVerifier,
        };
      }

      const reqDataText = qs.stringify(reqData);
      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', reqDataText);

      if (tokenResponse.status === 200) {
        // Successful response
        let { access_token, token_type, expires_in, refresh_token } = tokenResponse.data;

        commit('SET_ACCESS_TOKEN', access_token);
        commit('SET_TOKEN_TYPE', token_type);
        commit('SET_EXPIRES_IN', expires_in);
        commit('SET_REFRESH_TOKEN', refresh_token);

        await dispatch('storeRefreshToken');

        return true;
      } else {
        // No success
        return false;
      }
    },

    async loadRefreshToken({ commit }) {
      let token = await ipcRenderer.invoke('read-file', 'token', 'refresh.token');

      if (token !== null) {
        commit('SET_REFRESH_TOKEN', token);
        return true;
      } else {
        return false;
      }
    },

    async storeRefreshToken({ state }) {
      await ipcRenderer.invoke('write-file', 'token', 'refresh.token', state.refresh_token);
    },
  },

  getters: {
    redirect_uri(state) {
      return `http://localhost:${state.port}/cb`;
    },

    authUri(state, getters, rootState) {
      const authURI = 'https://accounts.spotify.com/authorize?' +
        `client_id=${rootState.config.client_id}&` +
        `response_type=code&` +
        `redirect_uri=${getters.redirect_uri}&` +
        `code_challenge_method=S256&` +
        `code_challenge=${state.codePair.codeChallenge}&` +
        `state=${state.state}&` +
        `scope=${state.scope}`;

      return authURI;
    },
  },
};