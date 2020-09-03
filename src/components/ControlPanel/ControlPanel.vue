<template>
  <VRow no-gutters class="panel" justify="end">
    <VBtn :color="running ? 'error': 'primary'" small @click.native="startStop">{{ running ? 'Stop' : 'Start' }}</VBtn>
  </VRow>
</template>
<script>
export default {
  name: 'ControlPanel',
  
  computed: {
    running() {
      return !!this.$store.state.nowplaying.updateTimeoutID;
    },
  },

  methods: {
    async startStop() {
      if (this.running) {
        await this.$store.dispatch('stopUpdateTimeout');
      } else {
        await this.$store.dispatch('getNowPlayingData');
        await this.$store.dispatch('writeOutputFiles');
        await this.$store.dispatch('startUpdateTimeout');
      }
    },
  },
}
</script>