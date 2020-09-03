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
}
</script>