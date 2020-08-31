<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VBtn color="primary" @click.native="deAuth()">De-Auth</VBtn>
      <VBtn color="primary" @click.native="forceAuthRefresh()" :disabled="!allowAuthRefresh">Force Auth Refresh</VBtn>
      <VBtn color="primary" @click.native="reloadConfig()">Reload Config</VBtn>
    </VCol>
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