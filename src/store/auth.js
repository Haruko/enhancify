const pkce = require('pkce');
const axios = require('axios');
const qs = require('querystring');

import { ipcRenderer } from 'electron';
import router from '../router'

export default {
  state: {
    port: 8080,
    scope: [
      'user-read-playback-state',
      'playlist-read-private',
      'playlist-modify-private'
    ].join(' '),

    state: pkce.createChallenge(),
    codePair: pkce.create(),

    access_token: undefined,
    token_type: undefined,
    expires_in: undefined,
    user_id: undefined,

    refresh_token: undefined,
    refreshTokenTimeoutID: undefined,
    refreshFailCount: 0,
  },

  mutations: {
    SET_AUTH_PROP(state, { prop, value }) {
      state[prop] = value;
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

      commit('SET_AUTH_PROP', { prop: 'state', value: localState });
      commit('SET_AUTH_PROP', { prop: 'codePair', value: localCodePair });
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

        commit('SET_AUTH_PROP', { prop: 'access_token', value: access_token });
        commit('SET_AUTH_PROP', { prop: 'token_type', value: token_type });
        commit('SET_AUTH_PROP', { prop: 'expires_in', value: expires_in });
        commit('SET_AUTH_PROP', { prop: 'refresh_token', value: refresh_token });

        await dispatch('setupRefreshTokenTimeout');
        await dispatch('storeRefreshToken');
        await dispatch('getUserId');

        // return true;
        return true;
      } else {
        // No success

        commit('SET_AUTH_PROP', { prop: 'access_token', value: undefined });
        commit('SET_AUTH_PROP', { prop: 'token_type', value: undefined });
        commit('SET_AUTH_PROP', { prop: 'expires_in', value: undefined });
        commit('SET_AUTH_PROP', { prop: 'refresh_token', value: undefined });
        commit('SET_AUTH_PROP', { prop: 'user_id', value: undefined });

        return false;
      }
    },
    
    // Get the user ID after getting access token
    async getUserId({ getters, commit }) {
      const response = await axios.get('https://api.spotify.com/v1/me', { headers: getters.authHeader, });
      
      if (response.status === 200) {
        commit('SET_AUTH_PROP', { prop: 'user_id', value: response.data.id });
      } else {
        commit('SET_AUTH_PROP', { prop: 'user_id', value: undefined });
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
          commit('SET_AUTH_PROP', { prop: 'refreshFailCount', value: 0 });
          await dispatch('setupRefreshTokenTimeout');
        } else {
          commit('SET_AUTH_PROP', { prop: 'refreshFailCount', value: state.refreshFailCount + 1 });
          await dispatch('setupRefreshTokenTimeout');
          if (state.refreshFailCount === 5) {
            await dispatch('deAuth');
            router.push('/');
          }
        }
      }, timeoutLength);

      commit('SET_AUTH_PROP', { prop: 'refreshTokenTimeoutID', value: refreshTokenTimeoutID });
    },

    // Load refresh token from file
    async loadRefreshToken({ commit }) {
      let token = await ipcRenderer.invoke('read-file', 'token');

      if (typeof token !== 'undefined') {
        commit('SET_AUTH_PROP', { prop: 'refresh_token', value: token });
        return true;
      } else {
        return false;
      }
    },

    // Store refresh token in file
    async storeRefreshToken({ state }) {
      await ipcRenderer.invoke('write-file', 'token', state.refresh_token);
    },

    // Force removal of auth
    async deAuth({ state, commit, dispatch }) {
      commit('SET_AUTH_PROP', { prop: 'state', value: pkce.createChallenge() });
      commit('SET_AUTH_PROP', { prop: 'codePair', value: pkce.create() });
      commit('SET_AUTH_PROP', { prop: 'access_token', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'refresh_token', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'token_type', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'expires_in', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'user_id', value: undefined });
      clearTimeout(state.refreshTokenTimeoutID);
      commit('SET_AUTH_PROP', { prop: 'refreshTokenTimeoutID', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'refreshFailCount', value: 0 });
      
      await dispatch('stopNowPlayingTimeouts');

      await ipcRenderer.invoke('delete-file', 'token');
      router.push('/');
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

    authHeader(state) {
      return {
        Authorization: `${state.token_type} ${state.access_token}`,
      };
    },
  },
};