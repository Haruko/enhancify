/* global __static */
const path = require('path');
const json5 = require('json5');

import fs from 'electron-fs-extra';

export default {
  state: {
    configData: {
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
  },

  mutations: {
    SET_CONFIG(state, configData) {
      Object.keys(state.configData)
        .forEach(key => {
          state.configData[key] = configData[key];
        });
    },
  },

  actions: {
    async loadConfig({ state, commit, dispatch, getters }) {
      // Check if the config file exists
      const configExist = await fs.pathExists(getters.configPath);

      let config;

      if (configExist) {
        // If it exists, load the config
        const configText = await fs.readFile(getters.configPath)

        try {
          // Try to load the config
          config = json5.parse(configText);
        } catch (error) {
          // In case of malformed config, load default
          config = state.configData;
        }
      } else {
        // If it does not exist, load the default config defined above
        await fs.ensureFile(getters.configPath);
        config = state.configData;
      }

      // Save config in state
      commit('SET_CONFIG', config);
      await dispatch('saveConfig', config);
    },

    async saveConfig({ getters }) {
      await fs.writeFile(getters.configPath, json5.stringify(getters.configData), { flag: 'w' });
    },
  },

  getters: {
    configPath() {
      const isBuild = process.env.NODE_ENV === 'production'
      const filePath = path.join(
        (isBuild ? __dirname : __static),
        (isBuild ? '../../' : ''),
        // 'config',
        'config.json'
      );

      return filePath;
    },

    outputPath() {
      const isBuild = process.env.NODE_ENV === 'production'
      const dirPath = path.join(
        (isBuild ? __dirname : __static),
        (isBuild ? '../../' : ''),
        'output'
      );

      return dirPath;
    },
  },
};