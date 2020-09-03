<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters>
        <VCol>
          <VBtn color="primary" small @click.native="openOutputDir">Open output directory</VBtn>
        </VCol>
        <VCol class="text-right">
          <VBtn color="primary" small @click.native="addFileFormat">
            <VIcon dense>mdi-plus</VIcon> Add new file format
          </VBtn>
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <FileFormatItem v-for="(format, index) in fileFormats" :key="index" v-model="fileFormats[index]" @save="updateFileFormat($event, index);" @remove="removeFileFormat(index);" />
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
<script>
import FileFormatItem from './FileFormatItem.vue';
import { ipcRenderer } from 'electron';

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

  methods: {
    openOutputDir() {
      ipcRenderer.send('open-directory', 'output');
    },
    
    async addFileFormat() {
      await this.$store.dispatch('addFileFormat');
    },
    
    async updateFileFormat(format, index) {
      await this.$store.dispatch('updateFileFormat', { format, index });
    },
    
    async removeFileFormat(index) {
      await this.$store.dispatch('removeFileFormat', index);
    },
  },
}
</script>