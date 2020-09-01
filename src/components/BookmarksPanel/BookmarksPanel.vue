<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center">
        <VCol cols="6">
          <VSwitch v-model="saveBookmarksLocal" dense hide-details="true" label="Save to local file"></VSwitch>
        </VCol>
        <VCol cols="6">
          <VBtn color="primary" small @click.native="openBookmarksFile">Open bookmarks file</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center">
        <VCol class="offset-sm-1" cols="5">
          <VSwitch v-model="allowDupesLocal" :disabled="!saveBookmarksLocal" dense hide-details="true" label="Allow duplicates"></VSwitch>
        </VCol>
        <VCol cols="6">
          <VBtn color="primary" small @click.native="openBookmarksDir">Open bookmarks directory</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center">
        <VCol cols="6">
          <VSwitch v-model="saveBookmarksSpotify" dense hide-details="true" label="Save to Spotify playlist"></VSwitch>
        </VCol>
        <VCol cols="6">
          <VBtn disabled color="primary" small @click.native="/*open playlist in browser*/">Open bookmarks playlist</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center">
        <VCol class="offset-sm-1" cols="5">
          <VSwitch v-model="allowDupesSpotify" :disabled="!saveBookmarksSpotify" dense hide-details="true" label="Allow duplicates"></VSwitch>
        </VCol>
      </VRow>
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