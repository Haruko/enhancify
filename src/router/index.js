import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store';

import Unauthorized from '../views/Unauthorized.vue';
import Authorized from '../views/Authorized.vue';

Vue.use(VueRouter)

const routes = [{
  path: '/',
  name: 'Unauthorized',
  component: Unauthorized,

  async beforeEnter(to, from, next) {
    // Clear auth localStorage data
    await store.dispatch('clearLocalStorage');

    // Check for refresh token file
    const exists = await store.dispatch('loadRefreshToken');
    if (exists) {
      try {
        await store.dispatch('requestAccessToken');
        next('/authorized');
      } catch (error) {
        next();
      }
    } else {
      next();
    }
  },
}, {
  path: '/callback',
  name: 'Callback',

  async beforeEnter(to, from, next) {
    const authCode = to.query.code;

    // Load auth localStorage data
    await store.dispatch('loadFromLocalStorage');

    if (typeof authCode !== 'undefined') {
      try {
        await store.dispatch('requestAccessToken', authCode);
        next('/authorized');
      } catch (error) {
        next('/');
      }
    }
  },
}, {
  path: '/authorized',
  name: 'Authorized',
  component: Authorized,

  async beforeEnter(to, from, next) {
    // Check for refresh token file
    const exists = await store.dispatch('loadRefreshToken');
    if (exists) {
      try {
        if (typeof store.state.auth.access_token === 'undefined') {
          await store.dispatch('requestAccessToken');
        }

        next();
      } catch (error) {
        next('/');
      }
    } else {
      next('/');
    }
  },
}];

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router