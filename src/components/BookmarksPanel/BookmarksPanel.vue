<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center" class="panel mb-3">
        <VCol cols="6">
          <VTextField :value="hotkey" label="Hotkey" class="mr-3" dense hide-details="true" disabled></VTextField>
        </VCol>
        <VCol cols="6" class="text-right">
          <VBtn v-if="!recordingHotkey" class="width-1" color="primary" small @click.native="startRecordingHotkeys">Edit</VBtn>
          <VBtn v-if="recordingHotkey" class="width-1" color="error" small @click.native="stopRecordingHotkeys">Stop</VBtn>
        </VCol>
      </VRow>
      <div class="panel mb-3">
        <VRow no-gutters align="center">
          <VCol cols="6">
            <VSwitch v-model="saveBookmarksLocal" dense hide-details="true" label="Save to local file"></VSwitch>
          </VCol>
          <VCol cols="6" class="text-right">
            <VBtn class="width-1" color="primary" small @click.native="openBookmarksFile">Open file</VBtn>
          </VCol>
        </VRow>
        <VRow no-gutters align="center">
          <VCol class="offset-sm-1" cols="5">
            <VSwitch v-model="allowDupesLocal" :disabled="!saveBookmarksLocal" dense hide-details="true" label="Allow duplicates"></VSwitch>
          </VCol>
          <VCol class="text-right flex-grow-1 flex-shrink-0">
            <VBtn class="width-2" color="primary" small @click.native="openBookmarksDir">Open directory</VBtn>
          </VCol>
        </VRow>
        <VRow no-gutters align="start" class="mt-2">
          <VCol class="flex-grow-0 flex-shrink-1">
            <VBtn class="square ml-2" color="info" small dense @click.native="showHelp.local = !showHelp.local">
              <VIcon dense small>mdi-help-circle-outline</VIcon>
            </VBtn>
          </VCol>
          <v-slide-y-transition origin="top left">
            <VCol v-show="showHelp.local" class="help-panel">
              <ul>
                <li>File will open in your computer's default program for that file extension.</li>
              </ul>
            </VCol>
          </v-slide-y-transition>
        </VRow>
      </div>
      <div class="panel">
        <VRow no-gutters align="center">
          <VCol cols="6">
            <VSwitch v-model="saveBookmarksSpotify" dense hide-details="true" label="Save to Spotify playlist"></VSwitch>
          </VCol>
          <VCol cols="6" class="text-right">
            <VBtn class="width-2" color="primary" small @click.native="createPlaylist">New playlist</VBtn>
          </VCol>
        </VRow>
        <VRow no-gutters align="center">
          <VCol class="offset-sm-1" cols="5">
            <VSwitch v-model="allowDupesSpotify" :disabled="!saveBookmarksSpotify" dense hide-details="true" label="Allow duplicates"></VSwitch>
          </VCol>
          <VCol class="text-right flex-grow-1 flex-shrink-0">
            <VBtn class="width-2" color="primary" small @click.native="openPlaylist('desktop')">Open on desktop</VBtn>
            <VBtn class="width-2" color="primary" small @click.native="openPlaylist('browser')">Open in browser</VBtn>
          </VCol>
        </VRow>
        <VRow no-gutters align="start" class="mt-2">
          <VCol class="flex-grow-0 flex-shrink-1">
            <VBtn class="square ml-2" color="info" small dense @click.native="showHelp.spotify = !showHelp.spotify">
              <VIcon dense small>mdi-help-circle-outline</VIcon>
            </VBtn>
          </VCol>
          <v-slide-y-transition origin="top left">
            <VCol v-show="showHelp.spotify" class="help-panel">
              <ul>
                <li>Feel free to change the playlist name and description in Spotify. It will still work!</li>
                <li>If you accidentally delete your playlist, click one of the Open buttons above and it will automatically be restored.</li>
                <li>If you want to completely start over, delete the playlist in Spotify and click the Create New Playlist button to lose all knowledge of previous playlist.</li>
              </ul>
            </VCol>
          </v-slide-y-transition>
        </VRow>
      </div>
    </VCol>
  </VRow>
</template>
<style scoped>
.v-input--selection-controls {
  margin-top: 0px;
}
</style>
<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'BookmarksPanel',

  data() {
    return {
      showHelp: {
        local: false,
        spotify: false,
      },
      recordingHotkey: false,
    };
  },

  computed: {
    saveBookmarksLocal: {
      get() {
        return this.$store.state.config.saveBookmarksLocal;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'saveBookmarksLocal', value });
      },
    },

    allowDupesLocal: {
      get() {
        return this.$store.state.config.allowDupesLocal;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'allowDupesLocal', value });
      },
    },

    saveBookmarksSpotify: {
      get() {
        return this.$store.state.config.saveBookmarksSpotify;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'saveBookmarksSpotify', value });
      },
    },

    allowDupesSpotify: {
      get() {
        return this.$store.state.config.allowDupesSpotify;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'allowDupesSpotify', value });
      },
    },

    hotkey: {
      get() {
        return this.$store.state.config.hotkey;
      },

      set() {

      },
    },
  },

  mounted() {
    // When pressing hotkey
    ipcRenderer.off('hotkey-pressed', this.hotkeyPressed);
    ipcRenderer.on('hotkey-pressed', this.hotkeyPressed);

    // When registering new hotkey
    ipcRenderer.off('register-hotkey-captured', this.hotkeyRegistered);
    ipcRenderer.on('register-hotkey-captured', this.hotkeyRegistered);
  },

  methods: {
    openBookmarksFile() {
      ipcRenderer.send('open-file', 'bookmarks');
    },

    openBookmarksDir() {
      ipcRenderer.send('open-directory', 'bookmarks');
    },

    async createPlaylist() {
      if (typeof this.$store.state.auth.user_id === 'undefined') {
        await this.$store.dispatch('getUserId');
      }

      const playlistId = await this.$store.dispatch('createPlaylist', this.$store.state.auth.user_id);
      await this.$store.dispatch('changeConfigProp', { prop: 'spotifyPlaylistId', value: playlistId });
    },

    async openPlaylist(preference) {
      await this.$store.dispatch('openBookmarksPlaylist', preference);
    },

    startRecordingHotkeys() {
      this.recordingHotkey = true;
      ipcRenderer.send('register-hotkey-start');
    },

    stopRecordingHotkeys() {
      ipcRenderer.send('register-hotkey-stop');
      this.recordingHotkey = false;
    },

    async hotkeyPressed() {
      if (this.saveBookmarksLocal || this.saveBookmarksSpotify) {
        await this.$store.dispatch('bookmarkNowPlaying');
      }
    },

    async hotkeyRegistered(event, hotkeyString) {
      await this.$store.dispatch('changeConfigProp', { prop: 'hotkey', value: hotkeyString });

      // Event is already unregistered in ipc.js
      this.recordingHotkey = false;
    },
  },
}
</script>