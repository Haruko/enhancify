<template>
  <div class="unauthorized">
    <div class="header">
      Unauthorized!
    </div>
    <div class="panel text-center">
      Need to authorize with Spotify!
      <p />
      <VBtn color="primary" @click.native="authorize()">Authorize</VBtn>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Unauthorized',
  
  methods: {
    authorize() {
      // :href="$store.getters.authUri"
      this.$store.dispatch('saveToLocalStorage')
        .then(() => {
          location.replace(this.$store.getters.authUri);
        });
    },
  },
}
</script>