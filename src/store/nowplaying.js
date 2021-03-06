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
    idleTimeoutID: undefined,

    desktopInstalled: true,
    bookmarkCooldown: 1000,
    currentlyBookmarking: false,
    lastBookmarkedTime: undefined,
    lastBookmarkedUri: undefined,
    lastBookmarkedFlagState: undefined,

    bookmarkCache: undefined,
  },

  mutations: {
    SET_NOWPLAYING_PROP(state, { prop, value }) {
      state[prop] = value;
    },

    PUSH_NOWPLAYING_ARRAY(state, { prop, value }) {
      state[prop].push(value);
    },

    CLEAR_TIMEOUT(state, timeoutName) {
      clearTimeout(state[timeoutName]);
      state[timeoutName] = undefined;
    },
  },

  actions: {
    async startStop({ state, rootState, commit, dispatch }) {
      if (typeof state.updateTimeoutID !== 'undefined') {
        // Stop
        ipcRenderer.send('unregister-hotkey');
        await dispatch('stopNowPlayingTimeouts');
        commit('CLEAR_TIMEOUT', 'idleTimeoutID');
        ipcRenderer.send('tray-stop');
      } else {
        // Start
        ipcRenderer.send('tray-start');
        await dispatch('getNowPlayingData');
        await dispatch('writeOutputFiles');
        await dispatch('startNowPlayingTimeouts');
        ipcRenderer.send('register-hotkey', rootState.config.hotkey);
      }
    },

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
        commit('CLEAR_TIMEOUT', 'idleTimeoutID');

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

        if (typeof state.idleTimeoutID === 'undefined' && (
            typeof state.nowPlayingData === 'undefined' ||
            rootState.config.idleOnPause)) {
          // If no data exists or we idle on pause then start idle timer
          await dispatch('startIdleTimer');
        }
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

    async startIdleTimer({ rootState, commit, dispatch }) {
      const timeoutID = setTimeout(async () => {
        commit('CLEAR_TIMEOUT', 'idleTimeoutID');
        ipcRenderer.send('unregister-hotkey');
        await dispatch('stopNowPlayingTimeouts');
        ipcRenderer.send('tray-stop');
      }, rootState.config.idleTimerLength * 60 * 1000);

      commit('SET_NOWPLAYING_PROP', { prop: 'idleTimeoutID', value: timeoutID });
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
          const { playlistId, created } = await dispatch('ensurePlaylist');

          let shouldWrite = true;

          // Check for duplicate
          // We can skip this if we had to create the playlist
          if (!created && !(bookmarkDupeFlagState & 0b10)) {
            const trackFound = await dispatch('findTrackInPlaylist', { playlistId: playlistId, trackId: state.nowPlayingData.item.id });
            shouldWrite = !trackFound;
          }

          // Add song to playlist
          if (shouldWrite) {
            await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
              uris: [state.nowPlayingData.item.uri],
            }, {
              headers: rootGetters.authHeader,
            });

            if (rootState.config.cacheBookmarksSpotify) {
              if (typeof state.bookmarkCache === 'undefined') {
                commit('SET_NOWPLAYING_PROP', { prop: 'bookmarkCache', value: [] });
              }

              commit('PUSH_NOWPLAYING_ARRAY', { prop: 'bookmarkCache', value: state.nowPlayingData.item.id });
            }

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

    // Creates playlist if it doesn't exist, follows if it's not followed, and returns { playlistId, created }
    async ensurePlaylist({ rootState, dispatch }) {
      if (typeof rootState.auth.user_id === 'undefined') {
        await dispatch('getUserId');
      }

      // Check if playlist exists
      let playlistId = await dispatch('getExistingPlaylist', rootState.config.spotifyPlaylistId);
      let created = false;

      if (typeof playlistId === 'undefined') {
        // Create it
        playlistId = await dispatch('createPlaylist', rootState.auth.user_id);
        created = true;
      }

      if (typeof rootState.config.spotifyPlaylistId === 'undefined' || created) {
        await dispatch('changeConfigProp', { prop: 'spotifyPlaylistId', value: playlistId });
      }

      // Check if following playlist because deleting is the same as unfollowing
      const following = await dispatch('checkIfFollowingPlaylist', { playlistId: playlistId, userId: rootState.auth.user_id });

      if (!following) {
        // Follow it
        await dispatch('followPlaylist', playlistId);
      }

      return { playlistId, created };
    },

    // Check if it exists by id
    // If not found, check by name
    // If not found, return undefined
    async getExistingPlaylist({ rootState, rootGetters }, playlistId) {
      // Get playlist ID from state if stored
      if (typeof playlistId === 'undefined' && typeof rootState.config.spotifyPlaylistId !== 'undefined') {
        playlistId = rootState.config.spotifyPlaylistId;
      }

      // First check by ID since it's more lightweight
      if (typeof playlistId !== 'undefined') {
        const queryUrl = `https://api.spotify.com/v1/playlists/${playlistId}?fields=id`;

        try {
          await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
          const response = await axios.get(queryUrl, { headers: rootGetters.authHeader, });

          if (typeof response.data !== 'undefined') {
            return response.data.id;
          }

          // Otherwise continue to checking the name
        } catch (error) {
          // Do nothing because we can still search by name
        }
      }

      // If still not found or we had an error, check by name
      const limit = 50; // Max limit possible
      let nextUrl = `https://api.spotify.com/v1/me/playlists?offset=0&limit=${limit}`;

      do {
        await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
        const response = await axios.get(nextUrl, { headers: rootGetters.authHeader, });

        // Check if it exists
        const playlist = response.data.items.find(p => p.name === config.bookmarks.playlistName);

        if (typeof playlist !== 'undefined') {
          return playlist.id;
        }

        nextUrl = response.data.next;
      } while (nextUrl !== null);

      // Didn't find it
      return undefined;
    },

    async createPlaylist({ rootGetters }, userId) {
      const playlistData = {
        name: config.bookmarks.playlistName,
        public: false,
        description: config.bookmarks.playlistDescription,
      };

      const response = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`,
        playlistData, {
          headers: rootGetters.authHeader,
        });

      return response.data.id;
    },

    // Check if we are following a playlist
    async checkIfFollowingPlaylist({ rootGetters }, { playlistId, userId }) {
      if (typeof playlistId !== 'undefined') {
        const queryUrl = `https://api.spotify.com/v1/playlists/${playlistId}/followers/contains?ids=${userId}`;

        try {
          await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
          const response = await axios.get(queryUrl, { headers: rootGetters.authHeader, });

          return response.data[0];
        } catch (error) {
          return false;
        }
      } else {
        return false;
      }
    },

    async followPlaylist({ rootGetters }, playlistId) {
      await axios.put(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
        public: false,
      }, {
        headers: rootGetters.authHeader,
        'Content-Type': 'application/json',
      });
    },

    async findTrackInPlaylist({ state, rootState, rootGetters, commit }, { playlistId, trackId }) {
      if (rootState.config.cacheBookmarksSpotify && typeof state.bookmarkCache !== 'undefined') {
        // If we are caching bookmarks and we have a cache saved then use that
        return !!state.bookmarkCache.find(id => id === trackId);
      } else {
        const limit = 100; // Max limit possible
        let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=${limit}`;

        let trackFound = false;
        let trackList = [];

        do {
          await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
          const response = await axios.get(nextUrl, { headers: rootGetters.authHeader, });

          // Check if it exists
          trackFound = trackFound || !!response.data.items.find(t => t.track.id === trackId);

          if (rootState.config.cacheBookmarksSpotify) {
            trackList = trackList.concat(response.data.items.map(t => t.track.id));
          }

          nextUrl = response.data.next;
        } while (nextUrl !== null && (rootState.config.cacheBookmarksSpotify || typeof trackFound === 'undefined'));

        if (rootState.config.cacheBookmarksSpotify) {
          commit('SET_NOWPLAYING_PROP', { prop: 'bookmarkCache', value: trackList });
        }

        return trackFound;
      }
    },

    async deAuthNowPlaying({ commit, dispatch }) {
      commit('SET_NOWPLAYING_PROP', { prop: 'nowPlayingData', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'interpolatedProgress', value: 0 });
      commit('SET_NOWPLAYING_PROP', { prop: 'previousAlbumArt', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedTime', value: undefined });
      commit('SET_NOWPLAYING_PROP', { prop: 'lastBookmarkedUri', value: undefined });
      // await dispatch('changeConfigProp', { prop: 'spotifyPlaylistId', value: undefined });

      await dispatch('stopNowPlayingTimeouts');
    },

    // preference = 'desktop' or 'browser'
    async openBookmarksPlaylist({ dispatch }, preference = 'desktop') {
      const { playlistId } = await dispatch('ensurePlaylist');

      ipcRenderer.send('open-playlist', playlistId, preference);
    },
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