<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters>
        <VBtn class="width-1" color="info" small @click.native="deAuth">Log Out</VBtn>
      </VRow>
    </VCol>
    <VCol>
      <VRow no-gutters justify="end">
        <VBtn v-if="canBookmark" class="width-1" color="info" small @click.native="bookmark">Bookmark</VBtn>
        <VBtn class="width-1" :color="running ? 'error': 'primary'" small @click.native="startStop">{{ running ? 'Stop' : 'Start' }}</VBtn>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
export default {
  name: 'ControlPanel',

  computed: {
    running() {
      return !!this.$store.state.nowplaying.updateTimeoutID;
    },

    canBookmark() {
      return this.running &&
        typeof this.$store.state.nowplaying.nowPlayingData !== 'undefined' && (
          this.$store.state.config.saveBookmarksLocal ||
          this.$store.state.config.saveBookmarksSpotify
        );
    },
  },

  methods: {
    async startStop() {
      await this.$store.dispatch('startStop');
    },

    async bookmark() {
      await this.$store.dispatch('bookmarkNowPlaying');
    },

    async deAuth() {
      await this.$store.dispatch('deAuth');
    },
  },
}
</script>