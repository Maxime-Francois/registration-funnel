import { createRouter, createWebHistory } from 'vue-router'
import RegistrationView from '@/views/RegistrationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: RegistrationView,
    },
    
  ],
})

export default router
