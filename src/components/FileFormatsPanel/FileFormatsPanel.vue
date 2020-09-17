<template>
  <VRow no-gutters class="panel">
    <VCol>
      <VRow no-gutters>
        <VCol class="text-right">
          <VBtn class="width-3" color="primary" small @click.native="addFileFormat">
            <VIcon dense>mdi-plus</VIcon> Add new file format
          </VBtn>
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <FileFormatItem v-for="(format, index) in fileFormats" :key="index" :ref="`FileFormatItem_${index}`" v-model="fileFormats[index]" @save="updateFileFormat($event, index);" @remove="removeFileFormat(index);" :class="index === fileFormats.length - 1 ? '' : 'mb-3'" />
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol class="text-right">
          <VBtn class="width-3" color="primary" small @click.native="openOutputDir">Open output directory</VBtn>
        </VCol>
      </VRow>
      <VRow no-gutters align="start" class="mt-2">
        <VCol class="flex-grow-0 flex-shrink-1">
          <VBtn class="square ml-2" color="info" small dense @click.native="showHelp = !showHelp">
            <VIcon dense small>mdi-help-circle-outline</VIcon>
          </VBtn>
        </VCol>
        <v-slide-y-transition origin="top left">
          <VCol v-show="showHelp" class="help-panel">
            <ul>
              <li>To create file formats, use tokens from the following list:
                <ul style="columns: 2">
                  <li v-for="(value, key) in $store.getters.nowPlayingFormatted" :key="key">
                    {{ config.labels.startTag }}{{ key }}{{ config.labels.endTag }}
                  </li>
                </ul>
              </li>
              <li>These can be used anywhere in the format text and case does not matter.</li>
            </ul>
          </VCol>
        </v-slide-y-transition>
      </VRow>
    </VCol>
  </VRow>
</template>
<style scoped>
.help-panel .v-expansion-panel-header {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
  min-height: 3rem;
  background-color: var(--v-panel_background-lighten1) !important;
}

.help-panel .v-expansion-panel-content {
  padding: 1rem !important;
}
</style>
<script>
import FileFormatItem from './FileFormatItem.vue';
import { ipcRenderer } from 'electron';
import config from 'json5-loader!@/config.json5';

export default {
  name: 'FileFormatsPanel',

  components: {
    FileFormatItem,
  },

  data() {
    return {
      config,
      showHelp: false,
    };
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