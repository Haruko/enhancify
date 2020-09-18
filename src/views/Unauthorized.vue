<template>
  <VContainer>
    <VExpansionPanels v-model="panels" multiple flat accordion class="main-panels">
      <VExpansionPanel>
        <VExpansionPanelHeader class="header" disabled>
          Unauthorized!
        </VExpansionPanelHeader>
        <VExpansionPanelContent color="#00000000">
          <VRow no-gutters class="panel" align="center">
            <VCol align="end" class="mr-3">
              Need to authorize with Spotify!
            </VCol>
            <VCol class="ml-3">
              <VBtn class="width-1" color="primary" small @click.native="authorize()">Authorize</VBtn>
            </VCol>
          </VRow>
        </VExpansionPanelContent>
      </VExpansionPanel>
    </VExpansionPanels>
  </VContainer>
</template>
<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'Unauthorized',

  data() {
    return {
      panels: [0],
    };
  },

  mounted() {
    ipcRenderer.removeAllListeners('tray-logout');
    ipcRenderer.removeAllListeners('tray-start');
    ipcRenderer.removeAllListeners('tray-stop');
    ipcRenderer.removeAllListeners('tray-bookmark');
    
    ipcRenderer.off('tray-login', this.authorize);
    ipcRenderer.on('tray-login', this.authorize);
  },

  methods: {
    async authorize() {
      await this.$store.dispatch('saveToLocalStorage');
      const error = await ipcRenderer.invoke('auth-server-start', this.$store.state.auth.state);

      if (!error) {
        location.replace(this.$store.getters.authUri);
      } else {
        console.log(error);
      }
    },
  },
}
</script>