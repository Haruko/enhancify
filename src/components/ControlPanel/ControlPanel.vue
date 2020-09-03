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
        this.$store.dispatch('stopUpdateTimeout');
      } else {
        this.$store.dispatch('startUpdateTimeout');
      }
    },
  },
}
</script>