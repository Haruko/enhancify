<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters>
        <VBtn color="info" small @click.native="deAuth">Log Out</VBtn>
      </VRow>
    </VCol>
    <VCol>
      <VRow no-gutters justify="end">
        <VBtn v-if="canBookmark" color="info" small @click.native="bookmark">Bookmark</VBtn>
        <VBtn :color="running ? 'error': 'primary'" small @click.native="startStop">{{ running ? 'Stop' : 'Start' }}</VBtn>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'ControlPanel',

  computed: {
    running() {
      return !!this.$store.state.nowplaying.updateTimeoutID;
    },

    canBookmark() {
      return this.running && (
        this.$store.state.config.saveBookmarksLocal ||
        this.$store.state.config.saveBookmarksSpotify
      );
    },
  },

  methods: {
    async startStop() {
      if (this.running) {
        ipcRenderer.send('unregister-hotkey');
        await this.$store.dispatch('stopNowPlayingTimeouts');
      } else {
        await this.$store.dispatch('getNowPlayingData');
        await this.$store.dispatch('writeOutputFiles');
        await this.$store.dispatch('startNowPlayingTimeouts');
        ipcRenderer.send('register-hotkey', this.$store.state.config.hotkey);
      }
    },

    async bookmark() {
      await this.$store.dispatch('bookmarkNowPlaying');
    },

    async deAuth() {
      await this.$store.dispatch('deAuth');
    },
  },
}
</script>