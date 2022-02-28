import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/mosaci_garden',
    name: 'Home',
    component: () => import('../views/MosaicCard.vue')
  },
  {
    path: '/mosaic_garden/transaction',
    name: 'Tx',
    component: () => import('../views/Transaction.vue')
  },
  {
    path: '/mosaic_garden/CreateMeta',
    name: 'Meta',
    component: () => import('../views/Meta.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
