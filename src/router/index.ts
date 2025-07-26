import { createRouter, createWebHistory } from 'vue-router'
import RegistrationFunnel from '@/components/RegisterFunnel.vue'


const routes = [
  {
    path: '/',
    name: 'Registration',
    component: RegistrationFunnel, // Point d’entrée unique "/"
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
