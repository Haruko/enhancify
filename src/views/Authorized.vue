<template>
  <!-- <VContainer>
      <VRow class="header">
        <VCol>
          Config
        </VCol>
      </VRow>
      <ConfigPanel />
      <VRow class="header">
        <VCol>
          Now Playing Labels
        </VCol>
      </VRow>
      <FileFormatsPanel />
      <VRow class="header">
        <VCol>
          Bookmarks
        </VCol>
      </VRow>
      <BookmarksPanel />
      <VRow class="header">
        <VCol>
          Debug
        </VCol>
      </VRow>
      <DebugPanel />
  </VContainer> -->
  <VContainer>
    <VExpansionPanels v-model="panels" multiple flat accordion>
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
<style>
.v-expansion-panel {
  background-color: rgba(0, 0, 0, 0) !important;
}

.v-expansion-panel-header,
.v-expansion-panel-content__wrap {
  padding: 0px !important;
}
</style>
<script>
import ConfigPanel from '@/components/ConfigPanel/ConfigPanel.vue';
import FileFormatsPanel from '@/components/FileFormatsPanel/FileFormatsPanel.vue';
import BookmarksPanel from '@/components/BookmarksPanel/BookmarksPanel.vue';
import DebugPanel from '@/components/DebugPanel/DebugPanel.vue';

export default {
  name: 'Authorized',

  components: {
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