<template>
  <!-- Make the 0.9em into half of the TitleBar height -->
  <VApp id="app" :style="{ height: `calc(${windowHeight}px - ${windowMaximized ? '0.9' : '0'}em)`, 'max-height': `${windowHeight}px`, }">
    <TitleBar />
    <MainLayout />
  </VApp>
</template>
<script>
import MainLayout from '@/layouts/MainLayout.vue';
import TitleBar from '@/components/TitleBar.vue';

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
    ipcRenderer.on('window-resize', (event, width, height, maximized) => {
      this.windowHeight = height;
      this.windowWidth = width;
      this.windowMaximized = maximized;
    });
  },
};
</script>