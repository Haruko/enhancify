import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    dark: true,
    themes: {
      dark: {
        // background: '#494F59',
        // text: '#ffffff',
        // primary: '#9993B2',
        // secondary: '#A7ABDD',
        // accent: '#B4D4EE',

        // background: '#202227',
        // text: '#ffffff',
        // primary: '#2081bd',
        // secondary: '#363d96',
        // accent: '#6653ad',

        // Spotify-based theme
        // background: '#121212',
        background: '#202227',
        panel_background: '#30333b',
        text: '#ffffff',
        primary: '#1DB954',
        secondary: '#1b4d2c',
        accent: '#1d82b9',

        error: '#b92a1d',
        info: '#1d82b9',
        success: '#1DB954',
        warning: '#b9511d',
      },
    },
  },
});
