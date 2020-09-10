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
    lastBookmarked: undefined,
    bookmarkPlaylistID: undefined,
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
          commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: undefined });
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
        commit('SET_AUTH_PROP', { prop: 'interpolatedProgress', value: progress });
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

      commit('SET_AUTH_PROP', { prop: 'updateTimeoutID', value: timeoutID });
    },

    async startSecondsTimeout({ commit, dispatch }, { length, progress }) {
      if (length < 1000) {
        return;
      }

      const timeoutID = setTimeout(async (currentProgress) => {
        currentProgress += 1000;
        commit('SET_AUTH_PROP', { prop: 'interpolatedProgress', value: currentProgress });
        await dispatch('writeOutputFiles', true);
        await dispatch('startSecondsTimeout', { length: length - 1000, progress: currentProgress });
      }, 1000, progress);

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
      if (!progressOnly && typeof state.nowPlayingData !== 'undefined') {
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

    async bookmarkNowPlaying({ state, rootState, getters, rootGetters, commit, dispatch }) {
      if (typeof state.nowPlayingData === 'undefined') {
        return;
      }

      // Check for bookmark cooldown
      const now = Date.now();
      const allowBookmark = typeof state.lastBookmarked === 'undefined' || now - state.lastBookmarked > state.bookmarkCooldown;

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
          let createdPlaylist = false;
          
          if (typeof state.bookmarkPlaylistID === 'undefined') {
            // Check if playlist exists
            const playlist = await dispatch('findEnhancifyPlaylist');
            if (typeof playlist === 'undefined') {
              // Create it

              if (typeof rootState.auth.user_id === 'undefined' || typeof rootState.auth.user_id === 'undefined') {
                await dispatch('getUserId');
              }

              const playlistData = {
                name: rootState.config.spotifyPlaylist,
                public: false,
                description: 'All of your Enhancify bookmarks!',
              };

              const createResponse = await axios.post(`https://api.spotify.com/v1/users/${rootState.auth.user_id}/playlists`,
                playlistData, {
                  headers: rootGetters.authHeader,
                });
              
              commit('SET_AUTH_PROP', { prop: 'bookmarkPlaylistID', value: createResponse.data.id });
              createdPlaylist = true;
            } else {
              commit('SET_AUTH_PROP', { prop: 'bookmarkPlaylistID', value: playlist.id });
            }
          }

          let shouldWrite = true;

          // Check for duplicate
          // We can skip this if we had to create the playlist
          if (!createdPlaylist && !rootState.config.allowDupesSpotify) {
            const track = await dispatch('findTrackInPlaylist', { playlistId: state.bookmarkPlaylistID, trackId: state.nowPlayingData.item.id });
            shouldWrite = !track;
          }

          // Add song to playlist
          if (shouldWrite) {
            await axios.post(`https://api.spotify.com/v1/playlists/${state.bookmarkPlaylistID}/tracks`, {
              uris: [state.nowPlayingData.item.uri],
            }, {
              headers: rootGetters.authHeader,
            });
          }
          
          // Set this to true even if we didn't bookmark it so that it can't be spammed
          didBookmark = true;
        }

        if (didBookmark) {
          commit('SET_AUTH_PROP', { prop: 'lastBookmarked', value: now });
        }
      }
    },

    async findEnhancifyPlaylist({ rootState, rootGetters }) {
      const limit = 50; // Max limit possible
      let nextUrl = `https://api.spotify.com/v1/me/playlists?offset=0&limit=${limit}`;

      let playlist;

      do {
        await new Promise((resolve) => setTimeout(() => resolve(), config.api.maxBookmarkRequestInterval));
        const response = await axios.get(nextUrl, { headers: rootGetters.authHeader, });

        // Check if it exists
        playlist = response.data.items.find(p => p.name === rootState.config.spotifyPlaylist);

        nextUrl = response.data.next;
      } while (nextUrl !== null && typeof playlist === 'undefined');

      if (typeof playlist !== 'undefined') {
        return playlist;
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
      commit('SET_AUTH_PROP', { prop: 'nowPlayingData', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'interpolatedProgress', value: 0 });
      commit('SET_AUTH_PROP', { prop: 'previousAlbumArt', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'lastBookmarked', value: undefined });
      commit('SET_AUTH_PROP', { prop: 'bookmarkPlaylistID', value: undefined });

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