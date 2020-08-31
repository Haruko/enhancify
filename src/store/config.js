const json5 = require('json5');

import { ipcRenderer } from 'electron';

export default {
  state: {
    // Editable by user if they want to for whatever reason
    client_id: '925a4155c7ea4913a35fc79f5eec4828',

    // Editable by user in frontend
    formatStrings: [{
      filename: 'trackinfo.txt',
      formatString: '[{ARTIST}] - [{TITLE}]',
    }, {
      filename: 'progress.txt',
      formatString: '[{PROGRESS}] / [{LENGTH}]',
    }],

    // Editable by user in frontend
    crossfade: 0,

    // Editable by user in frontend
    hotkey: [54, 61010],

    // Editable by user in frontend
    saveBookmarksLocal: true,
    saveBookmarksSpotify: false,
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
  },

  actions: {
    async loadConfig({ commit, dispatch }) {
      // Try to read file
      let config = await ipcRenderer.invoke('read-file', 'config', 'config.json');

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
      await ipcRenderer.invoke('write-file', 'config', 'config.json', json5.stringify(state));
    },

    async changeConfigProp({ commit, dispatch }, { prop, value }) {
      console.log('changeConfigProp', prop, value)
      commit('SET_CONFIG_PROP', { prop, value });

      await dispatch('storeConfig');
    }
  },
};