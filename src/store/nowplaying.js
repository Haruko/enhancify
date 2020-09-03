const axios = require('axios');

import { ipcRenderer } from 'electron';
import config from 'json5-loader!@/config.json5';

function formatTimeMS(ms) {
  if (typeof ms === 'number') {
    let progress = Math.floor(ms / 1000);
    const progressHours = Math.floor(progress / 3600);
    progress -= progressHours * 3600;
    const progressMins = Math.floor(progress / 60);
    progress -= progressMins * 60;
    const progressSecs = progress;

    const hrs = progressHours ? String(progressHours).padStart(2, '0') + ':' : '';
    const mins = String(progressMins).padStart(2, '0');
    const secs = String(progressSecs).padStart(2, '0');
    return `${hrs}${mins}:${secs}`;
  } else {
    return '00:00';
  }
}

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

      if (state.nowPlayingData !== null && state.nowPlayingData.is_playing) {
        const calculated = (state.nowPlayingData.item.duration_ms -
            rootState.config.crossfade * 1000) -
          state.nowPlayingData.progress_ms;

        timeoutLength = Math.min(calculated + 1000, config.api.maxRequestInterval);
      } else {
        timeoutLength = config.api.maxRequestInterval;
      }

      const timeoutID = setTimeout(async () => {
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('startUpdateTimeout');
      }, timeoutLength);

      commit('SET_AUTH_PROP', { prop: 'updateTimeoutID', value: timeoutID });
    },

    async stopUpdateTimeout({ commit }) {
      commit('CLEAR_UPDATE_TIMEOUT');
    },

    async mapFileFormats({ rootState, getters }) {
      // Build mapping of regexs
      const regexFunctions = Object.keys(getters.nowPlayingFormatted).map((key) => {
        return (str) =>
          str.replace(new RegExp(config.labels.startTag + key + config.labels.endTag, 'gi'), getters.nowPlayingFormatted[key]);
      });

      const fileFormats = [];

      rootState.config.fileFormats.forEach((file) => {
        let formattedString = file.format;
        regexFunctions.forEach((regex) => {
          formattedString = regex(formattedString);
        });

        fileFormats.push({
          filename: file.filename,
          data: formattedString,
        });
      });

      return fileFormats;
    },

    async writeOutputFiles({ state, dispatch }) {
      const fileFormats = await dispatch('mapFileFormats');

      for (const file of fileFormats) {
        await ipcRenderer.invoke('write-file', 'output', file.data, file.filename);
      }

      // Album art
      const albumArt = state.nowPlayingData.item.album.images;
      if (typeof albumArt === 'object' && albumArt.length > 0) {
        const url = albumArt[0].url;
        await ipcRenderer.invoke('download-file', url, 'album');
      }
    },
  },

  getters: {
    nowPlayingType(state) {
      if (state.nowPlayingData !== null) {
        return state.nowPlayingData.currently_playing_type;
      } else {
        return null;
      }
    },

    nowPlayingTitle(state, getters) {
      if (state.nowPlayingData !== null && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.name;
      } else {
        return 'Unknown';
      }
    },

    nowPlayingArtist(state, getters) {
      if (state.nowPlayingData !== null && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.artists
          .map((artist) => artist.name).join(', ');
      } else {
        return 'Unknown';
      }
    },

    nowPlayingAlbum(state, getters) {
      if (state.nowPlayingData !== null && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.album.name;
      } else {
        return 'Unknown';
      }
    },

    nowPlayingLength(state, getters) {
      if (state.nowPlayingData !== null && getters.nowPlayingType === 'track') {
        return formatTimeMS(state.nowPlayingData.item.duration_ms);
      } else {
        return '??:??';
      }
    },

    nowPlayingProgress(state, getters) {
      if (state.nowPlayingData !== null && getters.nowPlayingType === 'track') {
        return formatTimeMS(state.nowPlayingData.progress_ms);
      } else {
        return '??:??';
      }
    },

    nowPlayingFormatted(state, getters) {
      return {
        title: getters.nowPlayingTitle,
        artist: getters.nowPlayingArtist,
        album: getters.nowPlayingAlbum,
        length: getters.nowPlayingLength,
        progress: getters.nowPlayingProgress,
      };
    },
  },
};