<template>
  <VContainer>
    <ControlPanel />
    <VExpansionPanels v-model="panels" multiple flat accordion class="main-panels">
      <VExpansionPanel>
        <VExpansionPanelHeader class="header">
          Config
        </VExpansionPanelHeader>
        <VExpansionPanelContent color="#00000000">
          <ConfigPanel />
        </VExpansionPanelContent>
      </VExpansionPanel>
      <VExpansionPanel>
        <VExpansionPanelHeader class="header">
          Now Playing Labels
        </VExpansionPanelHeader>
        <VExpansionPanelContent color="#00000000">
          <FileFormatsPanel />
        </VExpansionPanelContent>
      </VExpansionPanel>
      <VExpansionPanel>
        <VExpansionPanelHeader class="header">
          Bookmarks
        </VExpansionPanelHeader>
        <VExpansionPanelContent color="#00000000">
          <BookmarksPanel />
        </VExpansionPanelContent>
      </VExpansionPanel>
      <VExpansionPanel>
        <VExpansionPanelHeader class="header">
          Debug
        </VExpansionPanelHeader>
        <VExpansionPanelContent color="#00000000">
          <DebugPanel />
        </VExpansionPanelContent>
      </VExpansionPanel>
    </VExpansionPanels>
  </VContainer>
</template>
<script>
import ControlPanel from '@/components/ControlPanel/ControlPanel.vue';
import ConfigPanel from '@/components/ConfigPanel/ConfigPanel.vue';
import FileFormatsPanel from '@/components/FileFormatsPanel/FileFormatsPanel.vue';
import BookmarksPanel from '@/components/BookmarksPanel/BookmarksPanel.vue';
import DebugPanel from '@/components/DebugPanel/DebugPanel.vue';

import { ipcRenderer } from 'electron';

export default {
  name: 'Authorized',

  components: {
    ControlPanel,
    ConfigPanel,
    FileFormatsPanel,
    BookmarksPanel,
    DebugPanel,
  },

  data() {
    return {
      panels: [0, 1, 2],
    };
  },

  computed: {
    running() {
      return !!this.$store.state.nowplaying.updateTimeoutID;
    },
  },

  mounted() {
    ipcRenderer.removeAllListeners('tray-login');

    ipcRenderer.off('tray-logout', this.trayLogout);
    ipcRenderer.on('tray-logout', this.trayLogout);

    ipcRenderer.off('tray-start', this.trayStart);
    ipcRenderer.on('tray-start', this.trayStart);

    ipcRenderer.off('tray-stop', this.trayStop);
    ipcRenderer.on('tray-stop', this.trayStop);

    ipcRenderer.off('tray-bookmark', this.trayBookmark);
    ipcRenderer.on('tray-bookmark', this.trayBookmark);
  },

  methods: {
    async trayLogout() {
      await this.$store.dispatch('deAuth');
    },

    async trayStart() {
      if (!this.running) {
        await this.$store.dispatch('startStop');
      }
    },

    async trayStop() {
      if (this.running) {
        await this.$store.dispatch('startStop');
      }
    },

    async trayBookmark() {
      if (this.running) {
        await this.$store.dispatch('bookmarkNowPlaying');
      }
    },
  },
}
</script>