<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center">
        <VCol>
          <VSwitch v-model="saveBookmarksLocal" label="Save bookmarks to local file"></VSwitch>
        </VCol>
        <VCol>
          <VBtn disabled color="primary" @click.native="/*open file*/">Open bookmarks file</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center">
        <VCol>
          <VSwitch v-model="saveBookmarksSpotify" label="Save bookmarks to Spotify playlist"></VSwitch>
        </VCol>
        <VCol>
          <VBtn disabled color="primary" @click.native="/*open playlist in browser*/">Open bookmarks playlist</VBtn>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
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
}
</script>