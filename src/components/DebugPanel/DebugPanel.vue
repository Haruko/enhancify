<template>
  <VRow no-gutters class="panel" justify="end">
    <VBtn color="primary" small @click.native="forceAuthRefresh" :disabled="!allowAuthRefresh || typeof refreshToken === 'undefined'">Force Auth Refresh</VBtn>
    <VBtn color="primary" small @click.native="reloadConfig">Reload Config</VBtn>
    <VBtn small :color="typeof refreshToken === 'undefined' ? 'error' : 'primary'" :disabled="!allowLoadRefreshToken" @click.native="reloadRefreshToken">Reload Refresh Token</VBtn>
  </VRow>
</template>
<script>
export default {
  name: 'DebugPanel',

  data() {
    return {
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
      await this.$store.dispatch('loadRefreshToken');
      this.allowLoadRefreshToken = true;
    },
  },
}
</script>