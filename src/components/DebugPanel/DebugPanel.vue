<template>
  <VRow no-gutters class="panel" justify="end">
    <VBtn color="primary" small @click.native="getNowPlayingData">Get Now Playing Data</VBtn>
    <VBtn color="primary" small @click.native="deAuth">De-Auth</VBtn>
    <VBtn color="primary" small @click.native="forceAuthRefresh" :disabled="!allowAuthRefresh">Force Auth Refresh</VBtn>
    <VBtn color="primary" small @click.native="reloadConfig">Reload Config</VBtn>
    <VBtn small :color="$store.state.auth.refresh_token === undefined ? 'error' : 'primary'" @click.native="reloadRefreshToken">Reload Refresh Token</VBtn>
  </VRow>
</template>
<script>
export default {
  name: 'DebugPanel',

  data() {
    return {
      allowAuthRefresh: true,
    };
  },

  methods: {
    async getNowPlayingData() {
      await this.$store.dispatch('getNowPlayingData');
      await this.$store.dispatch('writeOutputFiles');
      console.log(this.$store.state.nowplaying.nowPlayingData);
    },

    async deAuth() {
      await this.$store.dispatch('deAuth');
      this.$router.push('/');
    },

    async forceAuthRefresh() {
      this.allowAuthRefresh = false;
      await this.$store.dispatch('requestAccessToken');
      this.allowAuthRefresh = true;
    },

    async reloadConfig() {
      await this.$store.dispatch('loadConfig');
    },

    async reloadRefreshToken() {
      await this.$store.dispatch('loadRefreshToken');
    },
  },
}
</script>