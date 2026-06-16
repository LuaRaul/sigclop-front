import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import RequestsView from '../views/RequestsView.vue'
import StockView from '../views/StockView.vue'
import DocumentsView from '../views/DocumentsView.vue'
import DistributionsView from '../views/DistributionsView.vue'
import LoginView from '../views/LoginView.vue'
import ModulesView from '../views/ModulesView.vue'
import ApprovalsView from '../views/ApprovalsView.vue'
import ProfileView from '../views/ProfileView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView, name: 'dashboard' },
    { path: '/pedidos', component: RequestsView, name: 'requests' },
    { path: '/stock', component: StockView, name: 'stock' },
    { path: '/documentos', component: DocumentsView, name: 'documents' },
    { path: '/distribuicoes', component: DistributionsView, name: 'distributions' },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/aprovacoes', component: ApprovalsView, name: 'approvals' },
    { path: '/perfil', component: ProfileView, name: 'profile' },
    { path: '/:module(sectores|relatorios|utilizadores|auditoria|configuracoes)', component: ModulesView },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.name !== 'login' && !auth.token) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.token) {
    return { name: 'dashboard' }
  }
})

export default router
