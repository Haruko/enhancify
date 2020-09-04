<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters>
        <VBtn color="info" small @click.native="deAuth">Log Out</VBtn>
      </VRow>
    </VCol>
    <VCol>
      <VRow no-gutters justify="end">
        <VBtn :color="running ? 'error': 'primary'" small @click.native="startStop">{{ running ? 'Stop' : 'Start' }}</VBtn>
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
  },

  methods: {
    async startStop() {
      if (this.running) {
        await this.$store.dispatch('stopNowPlayingTimeouts');
      } else {
        await this.$store.dispatch('getNowPlayingData');
        await this.$store.dispatch('writeOutputFiles');
        await this.$store.dispatch('startNowPlayingTimeouts');
      }
    },

    async deAuth() {
      await this.$store.dispatch('deAuth');
      this.$router.push('/');
    },
  },
}
</script>