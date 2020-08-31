<template>
  <VRow no-gutters class="panel mb-2" align="center">
    <VCol cols="3" class="flex-grow-1 flex-shrink-0">
      <VTextField :value="value.filename" label="Filename" hide-details="true" dense @input="updateValue('filename', $event);"></VTextField>
    </VCol>
    <VCol class="flex-grow-1 flex-shrink-0">
      <VTextField :value="value.format" label="Format" hide-details="true" dense @input="updateValue('format', $event);"></VTextField>
    </VCol>
    <VCol cols="0" class="flex-grow-0 flex-shrink-0">
      <VBtn class="square" color="error" small dense @click.native="$emit('remove');">
        <VIcon dense small>mdi-trash-can-outline</VIcon>
      </VBtn>
    </VCol>
  </VRow>
</template>
<script>
export default {
  name: 'FileFormatItem',

  props: {
    value: {
      type: Object,
      required: true,
    },
  },

  methods: {
    updateValue(key, value) {
      this.$emit('update', { ...this.value, [key]: value });
    },
  },
}
</script>