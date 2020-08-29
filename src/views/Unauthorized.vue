<template>
  <div class="unauthorized">
    <div class="header">
      Unauthorized!
    </div>
    <div class="panel text-center">
      Need to authorize with Spotify!
      <p />
      <VBtn color="primary" @click.native="openSpotifyAuth()">Authorize</VBtn>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Unauthorized',

  data: () => ({
    testData: 'test',
  }),

  created() {
    
  },

  methods: {
    openSpotifyAuth() {

    },
  },
}
</script>