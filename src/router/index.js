import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

import Unauthorized from '../views/Unauthorized.vue'
import Authorized from '../views/Authorized.vue'

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
  path: '/cb',
  name: 'Callback',

  async beforeEnter(to, from, next) {
    const authError = to.query.error;
    const authState = to.query.state;
    const authCode = to.query.code;

    // Load auth localStorage data
    await store.dispatch('loadFromLocalStorage');

    if (authError || store.state.auth.state !== authState) {
      next('/');
    } else {
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
}, ]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router