<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center" class="mt-2 text-right">
        <VCol>
          <VBtn class="width-2" color="primary" small @click.native="reloadConfig">Reload Config</VBtn>
          <VBtn class="width-3" color="primary" small @click.native="forceAuthRefresh" :disabled="!allowAuthRefresh || typeof refreshToken === 'undefined'">Force Auth Refresh</VBtn>
          <VBtn class="width-3" small :color="typeof refreshToken === 'undefined' ? 'error' : 'primary'" :disabled="!allowLoadRefreshToken" @click.native="reloadRefreshToken">Reload Refresh Token</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="start" class="mt-2">
        <VCol class="flex-grow-0 flex-shrink-1">
          <VBtn class="square ml-2" color="info" small dense @click.native="showHelp = !showHelp">
            <VIcon dense small>mdi-help-circle-outline</VIcon>
          </VBtn>
        </VCol>
        <v-slide-y-transition origin="top left">
          <VCol v-show="showHelp" class="help-panel">
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
              <li>If that doesn't work then please submit a bug report here: <a @click.prevent="openGithub">{{ config.other.githubIssues }}</a>
                <VBtn class="square ml-2" color="info" x-small dense @click.native="copyGithub">
                  <VIcon dense x-small>mdi-content-copy</VIcon>
                </VBtn>
              </li>
            </ul>
          </VCol>
        </v-slide-y-transition>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import { ipcRenderer, clipboard } from 'electron';

import config from 'json5-loader!@/config.json5';

export default {
  name: 'DebugPanel',

  data() {
    return {
      config,
      showHelp: false,

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

    async openGithub() {
      ipcRenderer.send('open-url', config.other.githubIssues);
    },

    async copyGithub() {
      clipboard.writeText(config.other.githubIssues);
    },
  },
}
</script>