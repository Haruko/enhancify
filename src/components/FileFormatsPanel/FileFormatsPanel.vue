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
          <FileFormatItem v-for="(format, index) in fileFormats" :key="index" :ref="`FileFormatItem_${index}`" v-model="fileFormats[index]" @save="updateFileFormat($event, index);" @remove="removeFileFormat(index);" />
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
      const added = await this.$store.dispatch('addFileFormat');

      if (added) {
        const ref = `FileFormatItem_${this.fileFormats.length - 1}`;
        this.$refs[ref][0].$el[1].focus();
      }
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