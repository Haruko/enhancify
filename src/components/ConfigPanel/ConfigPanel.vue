<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center">
        <VCol>
          <VSlider dense v-model="crossfade" label="Crossfade" hint="Match this to the setting in Spotify" persistent-hint min="0" max="12" ticks thumb-label="always" thumb-size=0 @change="updateCrossfade"></VSlider>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
export default {
  name: 'ConfigPanel',

  data() {
    return {
      crossfade: this.$store.state.config.crossfade,
    };
  },

  methods: {
    async updateCrossfade() {
      await this.$store.dispatch('changeConfigProp', { prop: 'crossfade', value: this.crossfade });
    }
  }
}
</script>