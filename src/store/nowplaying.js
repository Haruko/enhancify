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
    nowPlayingData: undefined,
    interpolatedProgress: 0,
    previousAlbumArt: undefined,

    updateTimeoutID: undefined,
    secondsTimeoutID: undefined,

    bookmarkCooldown: 1000,
    currentlyBookmarking: false,
    lastBookmarkedTime: undefined,
    lastBookmarkedUri: undefined,
    lastBookmarkedFlagState: undefined,
  },

  mutations: {
    SET_NOWPLAYING_PROP(state, { prop, value }) {
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
          commit('SET_NOWPLAYING_PROP', { prop: 'nowPlayingData', value: responseData });
        } else {
          commit('SET_NOWPLAYING_PROP', { prop: 'nowPlayingData', value: undefined });
        }
      } catch (error) {
        if (error.response.status === 400) {
          await dispatch('loadRefreshToken');

          if (typeof rootState.auth.refresh_token === 'undefined') {
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

      if (typeof state.nowPlayingData !== 'undefined' && state.nowPlayingData.is_playing) {
        const calculated = (state.nowPlayingData.item.duration_ms -
            rootState.config.crossfade * 1000) -
          state.nowPlayingData.progress_ms;

        timeoutLength = Math.min(calculated + 1000, config.api.maxRequestInterval);

        // Subtract 1 second because Spotify's API seems to be ahead, probably due to buffering
        const progress = state.nowPlayingData.progress_ms - 1000;
        commit('SET_NOWPLAYING_PROP', { prop: 'interpolatedProgress', value: progress });
        await dispatch('startSecondsTimeout', { length: timeoutLength, progress: progress });
      } else {
        timeoutLength = config.api.maxRequestInterval;
      }

      const timeoutID = setTimeout(async () => {
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('stopNowPlayingTimeouts');
        await dispatch('startNowPlayingTimeouts');
      }, timeoutLength);

      commit('SET_NOWPLAYING_PROP', { prop: 'updateTimeoutID', value: timeoutID });
    },

    async startSecondsTimeout({ commit, dispatch }, { length, progress }) {
      if (length < 1000) {
        return;
      }

      const timeoutID = setTimeout(async (currentProgress) => {
        currentProgress += 1000;
        commit('SET_NOWPLAYING_PROP', { prop: 'interpolatedProgress', value: currentProgress });
        await dispatch('writeOutputFiles', true);
        await dispatch('startSecondsTimeout', { length: length - 1000, progress: currentProgress });
      }, 1000, progress);

      commit('SET_NOWPLAYING_PROP', { prop: 'secondsTimeoutID', value: timeoutID });
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
      if (!progressOnly && typeof state.nowPlayingData !== 'undefined') {
        const albumArt = state.nowPlayingData.item.album.images;
        if (typeof albumArt === 'object' && albumArt.length > 0) {
          const url = albumArt[0].url;
          if (url !== state.previousAlbumArt) {
            commit('SET_NOWPLAYING_PROP', { prop: 'previousAlbumArt', value: url });
            await ipcRenderer.invoke('download-file', url, 'album');
          }
        }
      }
    },

    async bookmarkNowPlaying({ state, rootState, commit, getters, rootGetters, dispatch }) {
      // Check for basic bookmark blocks
      if (
        // Currently in the process of bookmarking
        state.currentlyBookmarking ||
        // We don't want to bookmark things
        (
          !rootState.config.saveBookmarksLocal &&
          !rootState.config.saveBookmarksSpotify
        ) ||
        // We need to wait longer before bookmarking
        (
          typeof state.lastBookmarkedTime !== 'undefined' &&
          Date.now() - state.lastBookmarkedTime <= state.bookmarkCooldown
        )
      ) {
        return;
      }



      commit('SET_NOWPLAYING_PROP', { prop: 'currentlyBookmarking', value: true });

      // Update now playing data to get most recent
      try {
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('stopNowPlayingTimeouts');
        await dispatch('startNowPlayingTimeouts');
      } catch (error) {
        commit('SET_NOWPLAYING_PROP', { prop: 'currentlyBookmarking', value: false });
        return;
      }

      // Set it here so we can't spam if the next check fails
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedTime', value: Date.now() });



      // Save it in case the user changes
      const bookmarkFlagState = rootGetters.bookmarkFlagState;
      const bookmarkDupeFlagState = rootGetters.bookmarkDupeFlagState;
      const isLastBookmarked = state.nowPlayingData.item.uri === state.lastBookmarkedUri;

      // Check if anything is playing
      if (typeof state.nowPlayingData === 'undefined') {
        commit('SET_NOWPLAYING_PROP', { prop: 'currentlyBookmarking', value: false });
        return;
      }



      // Do the actual bookmarking
      let didBookmark = 0b00;

      // Local
      if (
        // We want to bookmark local
        (bookmarkFlagState & 0b01) &&
        // Not the same song or the state has changed to allow bookmarks now
        (
          !isLastBookmarked ||
          (state.lastBookmarkedFlagState & 0b01) === 0)
      ) {
        // track, artist, uri
        const artists = getters.nowPlayingArtist;
        const track = getters.nowPlayingTitle;
        const uri = state.nowPlayingData.item.external_urls.spotify;
        const bookmarkText = `"${artists.replace(/"/g, '""')}","${track.replace(/"/g, '""')}","${uri.replace(/"/g, '""')}"`;

        const success = await ipcRenderer.invoke('bookmark-song', bookmarkText, bookmarkDupeFlagState & 0b01);
        didBookmark |= success && 0b01;
      }



      // Spotify
      if (
        // We want to bookmark remote
        (bookmarkFlagState & 0b10) &&
        // Not the same song or the state has changed to allow bookmarks now
        (
          !isLastBookmarked ||
          (state.lastBookmarkedFlagState & 0b10) === 0)
      ) {
        try {
          // Check if playlist exists
          const foundPlaylist = await dispatch('findEnhancifyPlaylist');

          if (typeof foundPlaylist === 'undefined') {
            // Create it
            if (typeof rootState.auth.user_id === 'undefined') {
              await dispatch('getUserId');
            }

            const playlistData = {
              name: rootState.config.spotifyPlaylistName,
              public: false,
              description: config.bookmarks.playlistDescription,
            };

            const createResponse = await axios.post(`https://api.spotify.com/v1/users/${rootState.auth.user_id}/playlists`,
              playlistData, {
                headers: rootGetters.authHeader,
              });

            commit('SET_CONFIG_PROP', { prop: 'spotifyPlaylistId', value: createResponse.data.id });
          } else {
            commit('SET_CONFIG_PROP', { prop: 'spotifyPlaylistId', value: foundPlaylist });
          }



          let shouldWrite = true;

          // Check for duplicate
          // We can skip this if we had to create the playlist
          if (typeof foundPlaylist !== 'undefined' && !(bookmarkDupeFlagState & 0b10)) {
            const track = await dispatch('findTrackInPlaylist', { playlistId: rootState.config.spotifyPlaylistId, trackId: state.nowPlayingData.item.id });
            shouldWrite = !track;
          }

          // Add song to playlist
          if (shouldWrite) {
            await axios.post(`https://api.spotify.com/v1/playlists/${rootState.config.spotifyPlaylistId}/tracks`, {
              uris: [state.nowPlayingData.item.uri],
            }, {
              headers: rootGetters.authHeader,
            });

            didBookmark |= 0b10;
          }
        } catch (error) {
          // Just say we didn't do it so we can come back and do it next time
        }
      }



      if (didBookmark) {
        commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedUri', value: state.nowPlayingData.item.uri });
      }

      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedFlagState', value: bookmarkFlagState });
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedTime', value: Date.now() });
      commit('SET_NOWPLAYING_PROP', { prop: 'currentlyBookmarking', value: false });
    },

    async findEnhancifyPlaylist({ rootState, rootGetters }) {
      const playlistId = rootState.config.spotifyPlaylistId;

      if (typeof playlistId !== 'undefined') {
        const queryUrl = `https://api.spotify.com/v1/playlists/${playlistId}?fields=id`;

        try {
          await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
          const response = await axios.get(queryUrl, { headers: rootGetters.authHeader, });
          
          return response.data.id;
        } catch (error) {
          return undefined;
        }
      } else {
        return undefined;
      }
    },

    async findTrackInPlaylist({ rootGetters }, { playlistId, trackId }) {
      const limit = 100; // Max limit possible
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=${limit}`;

      let foundTrack;

      do {
        await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
        const response = await axios.get(nextUrl, { headers: rootGetters.authHeader, });

        // Check if it exists
        foundTrack = response.data.items.find(t => t.track.id === trackId);

        nextUrl = response.data.next;
      } while (nextUrl !== null && typeof foundTrack === 'undefined');

      if (typeof foundTrack !== 'undefined') {
        return foundTrack;
      } else {
        return undefined;
      }
    },

    async deAuthNowPlaying({ commit, dispatch }) {
      commit('SET_NOWPLAYING_PROP', { prop: 'nowPlayingData', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'interpolatedProgress', value: 0 });
      commit('SET_NOWPLAYING_PROP', { prop: 'previousAlbumArt', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedTime', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedUri', value: undefined });
      commit('SET_CONFIG_PROP', { prop: 'spotifyPlaylistId', value: undefined });

      await dispatch('stopNowPlayingTimeouts');
    }
  },

  getters: {
    nowPlayingType(state) {
      if (typeof state.nowPlayingData !== 'undefined') {
        return state.nowPlayingData.currently_playing_type;
      } else {
        return undefined;
      }
    },

    nowPlayingTitle(state, getters) {
      if (typeof state.nowPlayingData !== 'undefined' && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.name;
      } else {
        return 'Unknown';
      }
    },

    nowPlayingArtist(state, getters) {
      if (typeof state.nowPlayingData !== 'undefined' && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.artists
          .map((artist) => artist.name).join(', ');
      } else {
        return 'Unknown';
      }
    },

    nowPlayingAlbum(state, getters) {
      if (typeof state.nowPlayingData !== 'undefined' && getters.nowPlayingType === 'track') {
        return state.nowPlayingData.item.album.name;
      } else {
        return 'Unknown';
      }
    },

    nowPlayingLength(state, getters) {
      if (typeof state.nowPlayingData !== 'undefined' && getters.nowPlayingType === 'track') {
        return formatTimeMS(state.nowPlayingData.item.duration_ms);
      } else {
        return '??:??';
      }
    },

    nowPlayingProgress(state, getters) {
      if (typeof state.nowPlayingData !== 'undefined' && getters.nowPlayingType === 'track') {
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