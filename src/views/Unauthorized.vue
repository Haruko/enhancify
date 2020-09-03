<template>
  <VContainer>
    <VExpansionPanels v-model="panels" multiple flat accordion class="main-panels" >
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
              <VBtn color="primary" @click.native="authorize()">Authorize</VBtn>
            </VCol>
          </VRow>
        </VExpansionPanelContent>
      </VExpansionPanel>
    </VExpansionPanels>
  </VContainer>
</template>
<script>
export default {
  name: 'Unauthorized',

  data() {
    return {
      panels: [0],
    };
  },

  methods: {
    authorize() {
      // :href="$store.getters.authUri"
      this.$store.dispatch('saveToLocalStorage')
        .then(() => {
          location.replace(this.$store.getters.authUri);
        });
    },
  },
}
</script>