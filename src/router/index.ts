import { createRouter, createWebHistory } from 'vue-router'
import RegistrationFunnel from '@/components/RegisterFunnel.vue'


const routes = [
  {
    path: '/',
    name: 'Registration',
    component: RegistrationFunnel, 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
