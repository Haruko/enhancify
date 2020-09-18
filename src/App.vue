<template>
  <!-- Make the 0.9em into half of the TitleBar height -->
  <VApp id="app" :style="{ height: `calc(${windowHeight}px - ${windowMaximized ? '0.9' : '0'}em)`, 'max-height': `${windowHeight}px`, }">
    <TitleBar />
    <MainLayout />
  </VApp>
</template>
<script>
import MainLayout from '@/layouts/MainLayout.vue';
import TitleBar from '@/components/TitleBar/TitleBar.vue';

import { ipcRenderer } from 'electron';

export default {
  name: 'App',

  components: {
    TitleBar,
    MainLayout
  },

  data: () => ({
    windowHeight: 0,
    windowWidth: 0,
    windowMaximized: false,
  }),

  mounted() {
    ipcRenderer.off('window-resize', this.resizeWindow);
    ipcRenderer.on('window-resize', this.resizeWindow);

    ipcRenderer.off('disable-desktop', this.disableSpotifyDesktop);
    ipcRenderer.on('disable-desktop', this.disableSpotifyDesktop);
  },

  methods: {
    resizeWindow(event, width, height, maximized) {
      this.windowHeight = height;
      this.windowWidth = width;
      this.windowMaximized = maximized;
    },

    disableSpotifyDesktop() {
      this.$store.commit('SET_NOWPLAYING_PROP', { prop: 'desktopInstalled', value: false, });
    },
  },
};
</script>