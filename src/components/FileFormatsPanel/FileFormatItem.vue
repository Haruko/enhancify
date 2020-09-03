<template>
  <VForm v-model="valid" @submit.prevent="save">
    <input type="submit" hidden />
    <VRow no-gutters class="panel mb-2" align="center">
      <VCol cols="3" class="flex-grow-1 flex-shrink-0 mr-2">
        <VTextField v-model="filename" :rules="filenameRules" label="Filename" hide-details="true" dense required autofocus></VTextField>
      </VCol>
      <VCol class="flex-grow-1 flex-shrink-0">
        <VTextField v-model="format" label="Format" hide-details="true" dense></VTextField>
      </VCol>
      <VCol v-if="valid && (filename !== value.filename || format !== value.format)" cols="0" class="flex-grow-0 flex-shrink-0">
        <VBtn class="square" color="info" small dense @click.native="save">
          <VIcon dense small>mdi-content-save</VIcon>
        </VBtn>
      </VCol>
      <VCol cols="0" class="flex-grow-0 flex-shrink-0">
        <VBtn class="square" color="error" small dense @click.native="$emit('remove');">
          <VIcon dense small>mdi-trash-can-outline</VIcon>
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
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

  data() {
    return {
      filename: this.value.filename,
      format: this.value.format,
      valid: false,
      filenameRules: [
        value => !!value.trim() || ''
      ],
    };
  },

  watch: {
    value(newValue) {
      this.filename = newValue.filename;
      this.format = newValue.format;
    }
  },

  methods: {
    save() {
      if (this.valid) {
        this.$emit('save', { filename: this.filename, format: this.format });
      }
    },
  },
}
</script>