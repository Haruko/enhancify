<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters align="center">
        <VCol>
          <VSlider dense v-model="crossfade" label="Crossfade" hint="Match this to the setting in Spotify" persistent-hint min="0" max="12" ticks thumb-label="always" thumb-size=0 @change="updateCrossfade"></VSlider>
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol class="flex-grow-1 flex-shrink-0">
          <VSlider dense v-model="idleTimerLength" label="Idle Timer Length" hint="How long until Enhancify considers you idle and stops running" persistent-hint :min="minIdleTimerLength" :max="maxIdleTimerLength" step="5" ticks thumb-label="always" thumb-size=0 @change="updateIdleTimerLength"></VSlider>
        </VCol>
        <VCol class="flex-grow-0 flex-shrink-1 ml-2">
          <VSwitch v-model="idleOnPause" dense hide-details="true" label="Idle on Pause"></VSwitch>
        </VCol>
      </VRow>
      <VRow no-gutters align="center" justify="end">
        <VBtn class="width-3" color="primary" small @click.native="openConfigDir">Open Config Directory</VBtn>
      </VRow>
      <VRow no-gutters align="start" class="mt-2">
        <VCol class="flex-grow-0 flex-shrink-1">
          <VBtn class="square ml-2" color="info" small dense @click.native="showHelp = !showHelp">
            <VIcon dense small>mdi-help-circle-outline</VIcon>
          </VBtn>
        </VCol>
        <v-slide-y-transition origin="top left">
          <VCol v-show="showHelp" class="help-panel">
            <ul>
              <li>Idle on Pause when enabled will start the idle timer as soon as your music is paused. Spotify stops sending song data if paused for too long. If Idle on Pause is disabled, then the timer starts once Spotify stops sending this data. Once Spotify stops sending song data, the placeholder text for your Now Playing Labels will be used.</li>
            </ul>
          </VCol>
        </v-slide-y-transition>
      </VRow>
    </VCol>
  </VRow>
</template>
<style scoped>
.v-input--selection-controls {
  margin-top: 0px;
}
</style>
<style>

.v-input--switch .v-label {
  min-width: 7rem;
}
</style>
<script>
import { ipcRenderer } from 'electron';

import config from 'json5-loader!@/config.json5';

export default {
  name: 'ConfigPanel',

  data() {
    return {
      config,
      showHelp: false,

      crossfade: this.$store.state.config.crossfade,

      idleTimerLength: this.$store.state.config.idleTimerLength,
      minIdleTimerLength: config.other.minIdleTimer,
      maxIdleTimerLength: config.other.maxIdleTimer,
    };
  },

  computed: {
    idleOnPause: {
      get() {
        return this.$store.state.config.idleOnPause;
      },

      async set(value) {
        await this.$store.dispatch('changeConfigProp', { prop: 'idleOnPause', value });
      },
    },
  },

  methods: {
    async updateCrossfade() {
      await this.$store.dispatch('changeConfigProp', { prop: 'crossfade', value: this.crossfade });
    },

    async updateIdleTimerLength() {
      await this.$store.dispatch('changeConfigProp', { prop: 'idleTimerLength', value: this.idleTimerLength });
    },

    openConfigDir() {
      ipcRenderer.send('open-directory', 'config');
    },
  }
}
</script>