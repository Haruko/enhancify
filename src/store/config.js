const json5 = require('json5');

import { ipcRenderer } from 'electron';
import Vue from 'vue'

export default {
  state: {
    // Not editable by user
    spotifyPlaylistId: undefined,
    
    // Editable by user in frontend
    fileFormats: [{
      filename: 'trackinfo.txt',
      format: '<<artist>> - <<title>>',
    }, {
      filename: 'progress.txt',
      format: '<<progress>> / <<length>>',
    }],

    crossfade: 0,
    idleTimerLength: 20, // minutes
    idleOnPause: true,
    
    hotkey: 'Shift+Insert',

    saveBookmarksLocal: true,
    allowDupesLocal: false,
    
    saveBookmarksSpotify: false,
    allowDupesSpotify: false,
    cacheBookmarksSpotify: true,
  },

  mutations: {
    SET_CONFIG(state, configData) {
      Object.keys(state)
        .forEach(key => {
          if (typeof configData[key] !== 'undefined') {
            state[key] = configData[key];
          }
        });
    },

    SET_CONFIG_PROP(state, { prop, value }) {
      state[prop] = value;
    },

    ADD_FILE_FORMAT(state) {
      state.fileFormats.push({ filename: '', format: '' });
    },

    UPDATE_FILE_FORMAT(state, { format, index }) {
      Vue.set(state.fileFormats, index, format);
    },

    DELETE_FILE_FORMAT(state, index) {
      if (index >= 0 && index < state.fileFormats.length) {
        state.fileFormats.splice(index, 1);
      }
    },
  },

  actions: {
    async loadConfig({ commit, dispatch }) {
      // Try to read file
      let config = await ipcRenderer.invoke('read-file', 'config');

      if (typeof config !== 'undefined') {
        try {
          // Loading from file
          config = json5.parse(config);

          commit('SET_CONFIG', config);
        } catch (error) {
          // Malformed config file
          await dispatch('storeConfig');
        }
      } else {
        // No config file found
        await dispatch('storeConfig');
      }
    },

    async storeConfig({ state }) {
      const stateCopy = { ...state };

      // Remove blank info
      const fileFormatsCopy = [...stateCopy.fileFormats]
        .filter(format => format.filename !== '' || format.format !== '');

      stateCopy.fileFormats = fileFormatsCopy;

      await ipcRenderer.invoke('write-file', 'config', json5.stringify(stateCopy));
    },

    async changeConfigProp({ commit, dispatch }, { prop, value }) {
      commit('SET_CONFIG_PROP', { prop, value });

      await dispatch('storeConfig');
    },

    // File formats
    async addFileFormat({ state, commit }) {
      const emptyExists = state.fileFormats.filter((format) => format.filename === '' && format.format === '').length > 0;

      if (!emptyExists) {
        commit('ADD_FILE_FORMAT');
        return true;
      } else {
        return false;
      }
    },

    async updateFileFormat({ state, commit, dispatch }, { format, index }) {
      commit('UPDATE_FILE_FORMAT', { format, index });

      if (format.filename === '' && format.format === '') {
        // If this file format changes to completely empty, then remove other empty one
        const emptyIndex = state.fileFormats
          .findIndex((format, formatIndex) => format.filename === '' &&
            format.format === '' &&
            formatIndex !== index);

        if (emptyIndex >= 0) {
          commit('DELETE_FILE_FORMAT', emptyIndex);
        }
      }

      await dispatch('storeConfig');
    },

    async removeFileFormat({ commit, dispatch }, index) {
      commit('DELETE_FILE_FORMAT', index);

      await dispatch('storeConfig');
    },
  },

  getters: {
    bookmarkFlagState(state) {
      // 0b01 = local, 0b10 = spotify
      let flagState = 0b00;
      flagState |= state.saveBookmarksLocal ? 0b01 : 0b00;
      flagState |= state.saveBookmarksSpotify ? 0b10 : 0b00;

      return flagState;
    },

    bookmarkDupeFlagState(state) {
      // 0b01 = local, 0b10 = spotify
      let flagState = 0b00;
      flagState |= state.allowDupesLocal ? 0b01 : 0b00;
      flagState |= state.allowDupesSpotify ? 0b10 : 0b00;

      return flagState;
    },
  },
};