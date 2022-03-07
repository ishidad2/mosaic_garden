import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/MosaicCard.vue')
  },
  {
    path: 'transaction',
    name: 'Tx',
    component: () => import('../views/Transaction.vue')
  },
  {
    path: 'CreateMeta',
    name: 'Meta',
    component: () => import('../views/Meta.vue')
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
