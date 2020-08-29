<template>
  <div class="authorized">
    <div>
      <div class="header">
        Config
      </div>
      <div class="panel">
        <VSlider dense v-model="crossfade" label="Crossfade" hint="Match this to the setting in Spotify" persistent-hint min="0" max="12" ticks thumb-label="always" thumb-size=0></VSlider>
        <VSwitch v-model="bookmarkPlaylist" label="Save bookmarks to Spotify playlist" readonly></VSwitch>
      </div>
    </div>
    <div>
      <div class="header">
        Now Playing
      </div>
      <div class="panel">
        <VBtn color="primary" @click.native="/*open dir*/">Open file directory</VBtn>
        <VBtn color="primary" @click.native="/*add new file formatting thing*/">Open file directory</VBtn>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Home',

  data: () => ({
    crossfade: 0,
    bookmarkPlaylist: false,
  }),
}
</script>