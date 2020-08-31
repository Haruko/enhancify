<template>
  <VContainer>
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
  </VContainer>
</template>
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
}
</script>