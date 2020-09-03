const json5 = require('json5');

import { ipcRenderer } from 'electron';
import Vue from 'vue'

export default {
  state: {
    // Editable by user if they want to for whatever reason
    client_id: '925a4155c7ea4913a35fc79f5eec4828',

    // Editable by user in frontend
    fileFormats: [{
      filename: 'trackinfo.txt',
      format: '[{ARTIST}] - [{TITLE}]',
    }, {
      filename: 'progress.txt',
      format: '[{PROGRESS}] / [{LENGTH}]',
    }],

    // Editable by user in frontend
    crossfade: 0,

    // Editable by user in frontend
    hotkey: [54, 61010],

    // Editable by user in frontend
    saveBookmarksLocal: true,
    allowDupesLocal: false,
    saveBookmarksSpotify: false,
    allowDupesSpotify: false,
  },

  mutations: {
    SET_CONFIG(state, configData) {
      Object.keys(state)
        .forEach(key => {
          state[key] = configData[key];
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

      if (config !== null) {
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
};