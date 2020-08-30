const pkce = require('pkce');
const axios = require('axios');
const qs = require('querystring');

import { ipcRenderer } from 'electron';
import router from '../router'

export default {
  state: {
    port: 8080,
    scope: 'user-read-playback-state',

    state: pkce.createChallenge(),
    codePair: pkce.create(),

    access_token: undefined,
    token_type: undefined,
    expires_in: undefined,

    refresh_token: undefined,
    refreshTokenTimeoutID: undefined,
    refreshFailCount: 0,
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

    SET_TOKEN_TYPE(state, token) {
      state.token_type = token;
    },

    SET_EXPIRES_IN(state, token) {
      state.expires_in = token;
    },

    SET_REFRESH_TOKEN(state, token) {
      state.refresh_token = token;
    },

    SET_REFRESH_TOKEN_TIMEOUT_ID(state, id) {
      state.refreshTokenTimeoutID = id;
    },

    SET_REFRESH_FAIL_COUNT(state, count) {
      state.refreshFailCount = count;
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

    // Request new access token from Spotify
    // Handles both authorization and refresh token payloads
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

        await dispatch('setupRefreshTokenTimeout');

        await dispatch('storeRefreshToken');

        // return true;
        return true;
      } else {
        // No success

        commit('SET_ACCESS_TOKEN', undefined);
        commit('SET_TOKEN_TYPE', undefined);
        commit('SET_EXPIRES_IN', undefined);
        commit('SET_REFRESH_TOKEN', undefined);
        
        return false;
      }
    },

    // Setup the timer for requesting a new refresh token
    setupRefreshTokenTimeout({ state, commit, dispatch }) {
      clearTimeout(state.refreshTokenTimeoutID);

      let timeoutLength = state.expires_in ? (state.expires_in - 10) * 1000 : 2000;
      if (state.refreshFailCount > 0) {
        timeoutLength = 2 * 1000;
      }

      const refreshTokenTimeoutID = setTimeout(async () => {
        const success = await dispatch('requestAccessToken');

        if (success) {
          commit('SET_REFRESH_FAIL_COUNT', 0);
          await dispatch('setupRefreshTokenTimeout');
        } else {
          commit('SET_REFRESH_FAIL_COUNT', state.refreshFailCount + 1);
          await dispatch('setupRefreshTokenTimeout');
          if (state.refreshFailCount === 5) {
            await dispatch('deAuth');
            router.push('/');
          }
        }
      }, timeoutLength);

      commit('SET_REFRESH_TOKEN_TIMEOUT_ID', refreshTokenTimeoutID);
    },

    // Load refresh token from file
    async loadRefreshToken({ commit }) {
      let token = await ipcRenderer.invoke('read-file', 'token', 'refresh.token');

      if (token !== null) {
        commit('SET_REFRESH_TOKEN', token);
        return true;
      } else {
        return false;
      }
    },

    // Store refresh token in file
    async storeRefreshToken({ state }) {
      await ipcRenderer.invoke('write-file', 'token', 'refresh.token', state.refresh_token);
    },

    // Force removal of auth
    async deAuth({ state, commit }) {
      clearTimeout(state.refreshTokenTimeoutID);
      commit('SET_CODE_STATE', pkce.createChallenge());
      commit('SET_CODE_PAIR', pkce.create());
      commit('SET_ACCESS_TOKEN', undefined);
      commit('SET_REFRESH_TOKEN', undefined);
      commit('SET_TOKEN_TYPE', undefined);
      commit('SET_EXPIRES_IN', undefined);
      commit('SET_REFRESH_TOKEN_TIMEOUT_ID', undefined);
      commit('SET_REFRESH_FAIL_COUNT', 0);

      await ipcRenderer.invoke('delete-file', 'token', 'refresh.token');
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