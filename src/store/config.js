/* global __static */
const path = require('path');
const json5 = require('json5');

import fs from 'electron-fs-extra';

export default {
  state: {
    config: {
      outputDir: ['[{CURRENT_DIR}]', 'output'],

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

    configPath: undefined,
  },

  mutations: {
    SET_CONFIG(state, config) {
      state.config = config;
    },

    SET_CONFIG_PATH(state, configPath) {
      state.configPath = configPath;
    },
  },

  actions: {
    async setConfigPath({ commit }, configPath) {
      let newPath;

      if (typeof configPath === 'undefined') {
        const isBuild = process.env.NODE_ENV === 'production'
        newPath = path.join(
          (isBuild ? __dirname : __static),
          (isBuild ? '../../' : ''),
          'config',
          'config.json'
        );
      } else {
        newPath = configPath;
      }
      
      console.log('newPath', newPath)

      commit('SET_CONFIG_PATH', newPath);
    },

    async loadConfig({ state, commit, dispatch }) {
      // Check if the config file exists
      const configExist = await fs.pathExists(state.configPath);

      let config;

      if (configExist) {
        // If it exists, load the config
        const configText = await fs.readFile(state.configPath)

        try {
          // Try to load the config
          config = json5.parse(configText);
        } catch (error) {
          // In case of malformed config, load default
          config = state.config;
        }
      } else {
        // If it does not exist, load the default config defined above
        await fs.ensureFile(state.configPath);
        config = state.config;
      }

      // Save config in state
      commit('SET_CONFIG', config);
      await dispatch('saveConfig', config);
    },

    async saveConfig({ state }) {
      console.log(state.configPath);
      await fs.writeFile(state.configPath, json5.stringify(state.config), { flag: 'w' });
    },
  },
};