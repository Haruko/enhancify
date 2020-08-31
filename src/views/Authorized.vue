<template>
  <VContainer>
    <VRow class="header">
      <VCol>
        Config
      </VCol>
    </VRow>
    <VRow no-gutters class="panel">
      <VCol>
        <VRow no-gutters align="center">
          <VCol>
            <VSlider dense v-model="crossfade" label="Crossfade" hint="Match this to the setting in Spotify" persistent-hint min="0" max="12" ticks thumb-label="always" thumb-size=0></VSlider>
          </VCol>
        </VRow>
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
    <VRow class="header">
      <VCol>
        Now Playing Labels
      </VCol>
    </VRow>
    <VRow no-gutters class="panel">
      <VCol>
        <VRow class="panel-header">
          <VCol>
            File Formats
          </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol>
            <VBtn disabled color="primary" @click.native="/*open dir*/">Open file directory</VBtn>
            <VBtn color="primary" @click.native="$store.dispatch('addFileFormat');">
              <VIcon dense>mdi-plus</VIcon> Add new file format
            </VBtn>
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <FileFormat v-for="(format, index) in fileFormats" :key="index" v-model="fileFormats[index]" @update="$store.dispatch('updateFileFormat', { format: $event, index })" @remove="$store.dispatch('removeFileFormat', index);" />
          </VCol>
        </VRow>
      </VCol>
    </VRow>
    <VRow class="header">
      <VCol>
        Debug
      </VCol>
    </VRow>
    <VRow no-gutters class="panel">
      <VCol>
        <VBtn color="primary" @click.native="deAuth()">De-Auth</VBtn>
        <VBtn color="primary" @click.native="forceAuthRefresh()" :disabled="!allowAuthRefresh">Force Auth Refresh</VBtn>
        <VBtn color="primary" @click.native="reloadConfig()">Reload Config</VBtn>
      </VCol>
    </VRow>
  </VContainer>
</template>
<script>
import FileFormat from '@/components/FileFormat.vue';

export default {
  name: 'Authorized',

  components: {
    FileFormat
  },
  data() {
    return {
      // Debug
      allowAuthRefresh: true,
    };
  },

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

    fileFormats() {
      return this.$store.state.config.fileFormats;
    },
  },

  methods: {
    // Debug
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