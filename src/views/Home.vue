<template>
  <div class="home">
    <div class="header">
      Section header
    </div>
    <div class="panel">
      <div class="panel-header">
        Section header
      </div>
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn large color="primary" @click.native="enabled = true">On</VBtn>
      <p />
      <VBtn large color="secondary" @click.native="enabled = false">Off</VBtn>
    </div>
    <div class="panel">
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn large color="primary" @click.native="enabled = true">On</VBtn>
      <p />
      <VBtn large color="secondary" @click.native="enabled = false">Off</VBtn>
    </div>
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />x
    <p />
    <VBtn large color="accent">Accent</VBtn>
  </div>
</template>
<script>
export default {
  name: 'Home',

  data: () => ({
    enabled: true,
  }),
}
</script>