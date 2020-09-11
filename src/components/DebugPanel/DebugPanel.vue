<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center" class="mt-2">
        <VCol>
          <VBtn color="primary" small @click.native="forceAuthRefresh" :disabled="!allowAuthRefresh || typeof refreshToken === 'undefined'">Force Auth Refresh</VBtn>
          <VBtn color="primary" small @click.native="reloadConfig">Reload Config</VBtn>
          <VBtn small :color="typeof refreshToken === 'undefined' ? 'error' : 'primary'" :disabled="!allowLoadRefreshToken" @click.native="reloadRefreshToken">Reload Refresh Token</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="center" class="mt-2">
        <VCol>
          <ul>
            <li>Feel free to use these if functions aren't working.</li>
            <li>If these options don't help:
              <ol>
                <li>Open the config directory</li>
                <li>Close the application</li>
                <li>Delete the "{{config.filesystem.config.filename}}" and "{{config.filesystem.token.filename}}" files</li>
                <li>Restart the application and re-authorize</li>
              </ol>
            </li>
            <li>If that doesn't work then please submit a bug report here: https://github.com/Haruko/enhancify/issues</li>
          </ul>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import config from 'json5-loader!@/config.json5';

export default {
  name: 'DebugPanel',

  data() {
    return {
      config: config,

      allowAuthRefresh: true,
      allowLoadRefreshToken: true,
    };
  },

  computed: {
    refreshToken() {
      return this.$store.state.auth.refresh_token;
    },
  },

  methods: {
    async forceAuthRefresh() {
      this.allowAuthRefresh = false;
      await this.$store.dispatch('requestAccessToken');
      this.allowAuthRefresh = true;
    },

    async reloadConfig() {
      await this.$store.dispatch('loadConfig');
    },

    async reloadRefreshToken() {
      this.allowLoadRefreshToken = false;
      const existed = await this.$store.dispatch('loadRefreshToken');

      if (existed) {
        await this.$store.dispatch('requestAccessToken');
      }

      this.allowLoadRefreshToken = true;
    },
  },
}
</script>