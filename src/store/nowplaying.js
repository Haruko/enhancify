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
    interpolatedProgress: 0,
    previousAlbumArt: undefined,

    updateTimeoutID: undefined,
    secondsTimeoutID: undefined,

    lastBookmarked: null,
    bookmarkCooldown: 1000,
  },

  mutations: {
    SET_AUTH_PROP(state, { prop, value }) {
      state[prop] = value;
    },

    CLEAR_TIMEOUT(state, timeoutName) {
      clearTimeout(state[timeoutName]);
      state[timeoutName] = undefined;
    },
  },

  actions: {
    // Get data from API
    async getNowPlayingData({ rootState, rootGetters, commit, dispatch }) {
      let responseData;
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/player', { headers: rootGetters.authHeader, });

        responseData = response.data;

        if (typeof responseData === 'object' && responseData !== null) {
          commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: responseData });
        } else {
          commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: null });
        }
      } catch (error) {
        responseData = null;

        if (error.response.status === 400) {
          await dispatch('loadRefreshToken');

          if (rootState.auth.refresh_token === null) {
            // Unauthorized and have no saved refresh token
            await dispatch('deAuth');
          } else {
            await dispatch('requestAccessToken');

            if (typeof rootState.auth.access_token !== 'undefined') {
              await dispatch('getNowPlayingData');
            } else {
              // Unauthorized and refresh token didn't work
              await dispatch('deAuth');
            }
          }
        } else {
          console.log(error);
        }
      }
    },

    // Set a timer for the next API request
    async startNowPlayingTimeouts({ rootState, state, commit, dispatch }) {
      let timeoutLength;

      if (state.nowPlayingData !== null && state.nowPlayingData.is_playing) {
        const calculated = (state.nowPlayingData.item.duration_ms -
            rootState.config.crossfade * 1000) -
          state.nowPlayingData.progress_ms;

        timeoutLength = Math.min(calculated + 1000, config.api.maxRequestInterval);

        // Subtract 1 second because Spotify's API seems to be ahead, probably due to buffering
        commit('SET_AUTH_PROP', { prop: 'interpolatedProgress', value: state.nowPlayingData.progress_ms - 1000 });
        await dispatch('startSecondsTimeout', timeoutLength);
      } else {
        timeoutLength = config.api.maxRequestInterval;
      }

      const timeoutID = setTimeout(async () => {
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('stopNowPlayingTimeouts');
        await dispatch('startNowPlayingTimeouts');
      }, timeoutLength);

      commit('SET_AUTH_PROP', { prop: 'updateTimeoutID', value: timeoutID });
    },

    async startSecondsTimeout({ state, commit, dispatch }, length) {
      if (length < 1000) {
        return;
      }

      const timeoutID = setTimeout(async () => {
        commit('SET_AUTH_PROP', { prop: 'interpolatedProgress', value: state.interpolatedProgress + 1000 });
        await dispatch('writeOutputFiles', true);
        await dispatch('startSecondsTimeout', length - 1000);
      }, 1000);

      commit('SET_AUTH_PROP', { prop: 'secondsTimeoutID', value: timeoutID });
    },

    async stopNowPlayingTimeouts({ commit }) {
      commit('CLEAR_TIMEOUT', 'updateTimeoutID');
      commit('CLEAR_TIMEOUT', 'secondsTimeoutID');
    },

    // Set progressOnly to true to only process file formats that include <<progress>
    async mapFileFormats({ rootState, getters }, progressOnly = false) {
      // Build mapping of regexs
      // Need all even if updated due to progress change
      const regexFunctions = Object.keys(getters.nowPlayingFormatted).map((key) => {
        return (str) =>
          str.replace(new RegExp(config.labels.startTag + key + config.labels.endTag, 'gi'),
            getters.nowPlayingFormatted[key]);
      });


      const fileFormats = [];

      let processedFiles = rootState.config.fileFormats;

      if (progressOnly) {
        const progressRegex = new RegExp(config.labels.startTag + 'progress' + config.labels.endTag, 'gi');
        processedFiles = processedFiles.filter((file) => progressRegex.test(file.format));
      }

      processedFiles.forEach((file) => {
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

    // Set progressOnly to true to only process file formats that include <<progress>
    async writeOutputFiles({ state, commit, dispatch }, progressOnly = false) {
      const fileFormats = await dispatch('mapFileFormats', progressOnly);

      for (const file of fileFormats) {
        await ipcRenderer.invoke('write-file', 'output', file.data, file.filename);
      }

      // Album art
      if (!progressOnly && state.nowPlayingData !== null) {
        const albumArt = state.nowPlayingData.item.album.images;
        if (typeof albumArt === 'object' && albumArt.length > 0) {
          const url = albumArt[0].url;
          if (url !== state.previousAlbumArt) {
            commit('SET_AUTH_PROP', { prop: 'previousAlbumArt', value: url });
            await ipcRenderer.invoke('download-file', url, 'album');
          }
        }
      }
    },

    async bookmarkNowPlaying({ state, rootState, getters, commit, dispatch }) {
      if (state.nowPlayingData === null) {
        return;
      }

      // Check for bookmark cooldown
      const now = Date.now();
      const allowBookmark = state.allowBookmark === null || now - state.lastBookmarked > state.bookmarkCooldown;

      if (allowBookmark && (rootState.config.saveBookmarksLocal || rootState.config.saveBookmarksSpotify)) {
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('stopNowPlayingTimeouts');
        await dispatch('startNowPlayingTimeouts');

        let didBookmark = false;

        // Local
        if (rootState.config.saveBookmarksLocal) {
          // track, artist, uri
          const artists = getters.nowPlayingArtist;
          const track = getters.nowPlayingTitle;
          const uri = state.nowPlayingData.item.external_urls.spotify;
          const bookmarkText = `"${artists.replace(/"/g, '""')}","${track.replace(/"/g, '""')}","${uri.replace(/"/g, '""')}"`;

          ipcRenderer.send('bookmark-song', bookmarkText, rootState.config.allowDupesLocal);
          didBookmark = true;
        }

        // Spotify playlist
        if (rootState.config.saveBookmarksSpotify) {
          // allowDupesSpotify
          // didBookmark = true;
        }

        if (didBookmark) {
          commit('SET_AUTH_PROP', { prop: 'lastBookmarked', value: now });
        }
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
        // return formatTimeMS(state.nowPlayingData.progress_ms);
        return formatTimeMS(state.interpolatedProgress);
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