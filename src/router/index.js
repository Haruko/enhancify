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

  beforeEnter(to, from, next) {
    // Clear auth localStorage data
    store.dispatch('clearLocalStorage')
      // Check for refresh token file
      .then(() => store.dispatch('loadRefreshToken'))
      .then((existed) => {
        if (existed) {
          return store.dispatch('requestAccessToken')
            .then(() => next('/authorized'))
            .catch(() => next());
        } else {
          next();
        }
      });
  },
}, {
  path: '/cb',
  name: 'Callback',

  beforeEnter(to, from, next) {
    const authError = to.query.error;
    const authState = to.query.state;
    const authCode = to.query.code;

    // Load auth localStorage data
    store.dispatch('loadFromLocalStorage')
      .then(() => {
        if (authError || store.state.auth.state !== authState) {
          next('/');
        } else {
          store.dispatch('requestAccessToken', authCode)
            .then(() => next('/authorized'))
            .catch(() => next('/'));
        }
      });
  },
}, {
  path: '/authorized',
  name: 'Authorized',
  component: Authorized,
}, ]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router