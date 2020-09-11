<template>
  <VRow no-gutters class="title-bar">
    <VCol class="title-label flex-grow-0 flex-shrink-1">
      Enhancify{{ nowPlayingText ? ` - ${nowPlayingText}` : '' }}
    </VCol>
    <VCol class="window-controls flex-grow-1 flex-shrink-0">
      <VRow no-gutters justify="end">
        <VCol class="minimize-window flex-grow-0 flex-shrink-1">
          <VIcon dense dark @click.native="minimizeWindow">mdi-minus</VIcon>
        </VCol>
        <VCol class="maximize-window flex-grow-0 flex-shrink-1">
          <VIcon dense dark @click.native="maximizeWindow">mdi-crop-square</VIcon>
        </VCol>
        <VCol class="close-window flex-grow-0 flex-shrink-1">
          <VIcon dense dark @click.native="closeWindow">mdi-window-close</VIcon>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'TitleBar',

  computed: {
    nowPlayingText() {
      return this.$store.state.nowplaying.nowPlayingText;
    },
  },

  mounted() {
    this.updateNow();
    setInterval(this.updateNow.bind(this), 1000);
  },

  methods: {
    updateNow() {
      this.now = this.formatDate(new Date());
    },

    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const second = date.getSeconds().toString().padStart(2, '0');

      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    },

    minimizeWindow() {
      ipcRenderer.send('minimize-window');
    },

    maximizeWindow() {
      ipcRenderer.send('maximize-window');
    },

    closeWindow() {
      ipcRenderer.send('close-window');
    },
  },
};
</script>