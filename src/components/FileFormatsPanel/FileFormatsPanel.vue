<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow class="panel-header">
        <VCol>
          File Formats
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol>
          <VBtn disabled color="primary" @click.native="/*open dir*/">Open file directory</VBtn>
          <VBtn color="primary" @click.native="$store.dispatch('addFileFormat');">
            <VIcon dense>mdi-plus</VIcon> Add new file format
          </VBtn>
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <FileFormatItem v-for="(format, index) in fileFormats" :key="index" v-model="fileFormats[index]" @update="$store.dispatch('updateFileFormat', { format: $event, index })" @remove="$store.dispatch('removeFileFormat', index);" />
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import FileFormatItem from './FileFormatItem.vue';

export default {
  name: 'FileFormatsPanel',

  components: {
    FileFormatItem,
  },

  computed: {
    fileFormats() {
      return this.$store.state.config.fileFormats;
    },
  },
}
</script>