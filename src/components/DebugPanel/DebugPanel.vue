<template>
  <VRow no-gutters class="panel" justify="end">
    <VBtn color="primary" small @click.native="deAuth()">De-Auth</VBtn>
    <VBtn color="primary" small @click.native="forceAuthRefresh()" :disabled="!allowAuthRefresh">Force Auth Refresh</VBtn>
    <VBtn color="primary" small @click.native="reloadConfig()">Reload Config</VBtn>
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