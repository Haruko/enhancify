<template>
  <div class="authorized">
    <div>
      <div class="header">
        Config
      </div>
      <div class="panel">
        <VSlider dense v-model="crossfade" label="Crossfade" hint="Match this to the setting in Spotify" persistent-hint min="0" max="12" ticks thumb-label="always" thumb-size=0></VSlider>
        <VSwitch v-model="saveBookmarksLocal" label="Save bookmarks to local file"></VSwitch>
        <VSwitch v-model="saveBookmarksSpotify" label="Save bookmarks to Spotify playlist"></VSwitch>
      </div>
    </div>
    <div>
      <div class="header">
        Now Playing
      </div>
      <div class="panel">
        <VBtn color="primary" @click.native="/*open dir*/">Open file directory</VBtn>
        <VBtn color="primary" @click.native="/*add new file formatting thing*/">Open file directory</VBtn>
      </div>
    </div>
    <div class="header">
      Debug
    </div>
    <div class="panel">
      <VBtn color="primary" @click.native="deAuth()">De-Auth</VBtn>
      <VBtn color="primary" @click.native="forceAuthRefresh()" :disabled="!allowAuthRefresh">Force Auth Refresh</VBtn>
      <VBtn color="primary" @click.native="reloadConfig()">Reload Config</VBtn>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Authorized',

  data: () => ({
    // Debug
    allowAuthRefresh: true,
  }),

  computed: {
    crossfade: {
      get() {
        return this.$store.state.config.crossfade;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'crossfade', value });
      },
    },
    
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
    async forceAuthRefresh() {
      this.allowAuthRefresh = false;
      await this.$store.dispatch('requestAccessToken');
      this.allowAuthRefresh = true;
    },

    async deAuth() {
      await this.$store.dispatch('deAuth');
      this.$router.push('/');
    },

    async reloadConfig() {
      await this.$store.dispatch('loadConfig');
    },
  },
}
</script>