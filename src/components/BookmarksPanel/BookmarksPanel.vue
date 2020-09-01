<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center">
        <VCol cols="5">
          <VSwitch v-model="saveBookmarksLocal" label="Save bookmarks to local file"></VSwitch>
        </VCol>
        <VCol cols="7">
          <VBtn color="primary" small @click.native="openBookmarksFile">Open bookmarks file</VBtn>
          <VBtn color="primary" small @click.native="openBookmarksDir">Open bookmarks directory</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center">
        <VCol cols="5">
          <VSwitch v-model="saveBookmarksSpotify" label="Save bookmarks to Spotify playlist"></VSwitch>
        </VCol>
        <VCol cols="7">
          <VBtn disabled color="primary" small @click.native="/*open playlist in browser*/">Open bookmarks playlist</VBtn>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'BookmarksPanel',

  computed: {
    saveBookmarksLocal: {
      get() {
        return this.$store.state.config.saveBookmarksLocal;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'saveBookmarksLocal', value });
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
  },

  methods: {
    openBookmarksFile() {
      ipcRenderer.send('open-file', 'bookmarks');
    },
    openBookmarksDir() {
      ipcRenderer.send('open-directory', 'bookmarks');
    },
  },
}
</script>