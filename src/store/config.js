const json5 = require('json5');

import { ipcRenderer } from 'electron';

export default {
  state: {
    client_id: '925a4155c7ea4913a35fc79f5eec4828',

    formatStrings: [{
      filename: 'trackinfo.txt',
      formatString: '[{ARTIST}] - [{TITLE}]',
    }, {
      filename: 'progress.txt',
      formatString: '[{PROGRESS}] / [{LENGTH}]',
    }],

    crossfade: 0,

    hotkey: [54, 61010],
  },

  mutations: {
    SET_CONFIG(state, configData) {
      Object.keys(state)
        .forEach(key => {
          state[key] = configData[key];
        });
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
  },
};