import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';

import '@/assets/styles/main.scss';

Vue.config.productionTip = false;

async function init() {
  await store.dispatch('loadConfig');
  window.removeEventListener('message', handleHotReload);
  window.addEventListener('message', handleHotReload);

  new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
  }).$mount('#app');
}


async function handleHotReload(event) {
  if (event.data && typeof event.data === 'string' && /webpackHotUpdate/.test(event.data)) {
    console.log('Hot Reload');

    if (typeof store.state.auth.refresh_token === 'undefined') {
      const exists = await store.dispatch('loadRefreshToken');
      if (exists) {
        try {
          await store.dispatch('requestAccessToken');
        } catch (error) {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  }
}

init();