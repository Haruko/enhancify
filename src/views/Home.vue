<template>
  <div class="home">
    <div class="header">
      Header
    </div>
    <div class="panel">
      <div class="panel-header">
        Header
      </div>
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn class="square" small :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
      <VBtn small :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
    </div>
    <div class="panel">
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn class="square" medium :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
      <VBtn medium :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
    </div>
    <div class="panel">
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn class="square" large :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
      <VBtn large :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
    </div>
    <div class="panel">
      <VSwitch v-model="enabled" :label="enabled ? 'On' : 'Off'"></VSwitch>
      <VBtn class="square" x-large :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
      <VBtn x-large :color="enabled ? 'primary' : 'secondary'" @click.native="enabled = !enabled"></VBtn>
    </div>
    <div class="panel">
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