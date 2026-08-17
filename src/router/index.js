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

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
*/

const router = createRouter({
  history: createWebHistory(),

  routes: [

    /*
    |--------------------------------------------------------------------------
    | Público
    |--------------------------------------------------------------------------
    */

    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        public: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        requiresAuth: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Pedidos
    |--------------------------------------------------------------------------
    */

    {
      path: '/pedidos',
      name: 'requests',
      component: RequestsView,
      meta: {
        requiresAuth: true,
        permission: 'pedidos.visualizar',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Stock
    |--------------------------------------------------------------------------
    */

    {
      path: '/stock',
      name: 'stock',
      component: StockView,
      meta: {
        requiresAuth: true,
        permission: 'armazem.visualizar_stock',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Documentos
    |--------------------------------------------------------------------------
    */

    {
      path: '/documentos',
      name: 'documents',
      component: DocumentsView,
      meta: {
        requiresAuth: true,
        permission: 'documentos.visualizar',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Distribuições
    |--------------------------------------------------------------------------
    */

    {
      path: '/distribuicoes',
      name: 'distributions',
      component: DistributionsView,
      meta: {
        requiresAuth: true,
        permission: 'distribuicao.visualizar',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Aprovações
    |--------------------------------------------------------------------------
    */

    {
      path: '/aprovacoes',
      name: 'approvals',
      component: ApprovalsView,
      meta: {
        requiresAuth: true,
        permission: 'pedidos.aprovar',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Perfil
    |--------------------------------------------------------------------------
    */

    {
      path: '/perfil',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Módulos administrativos
    |--------------------------------------------------------------------------
    |
    | A permission necessária é determinada pelo módulo.
    |
    */

    {
      path: '/:module(sectores|relatorios|utilizadores|auditoria|configuracoes)',
      name: 'module',
      component: ModulesView,
      meta: {
        requiresAuth: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Não encontrado
    |--------------------------------------------------------------------------
    */

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: {
        name: 'dashboard',
      },
    },
  ],
})

/*
|--------------------------------------------------------------------------
| Permissions dos módulos
|--------------------------------------------------------------------------
*/

const modulePermissions = {
  sectores: 'departamentos.visualizar',
  relatorios: 'relatorios.visualizar',
  utilizadores: 'utilizadores.visualizar',
  auditoria: 'auditoria.visualizar',
  configuracoes: 'configuracoes.visualizar',
}

/*
|--------------------------------------------------------------------------
| Router Guard
|--------------------------------------------------------------------------
*/

router.beforeEach((to) => {
  const auth = useAuthStore()

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  if (to.name === 'login') {

    if (auth.isAuthenticated) {
      return {
        name: 'dashboard',
      }
    }

    return true
  }

  /*
  |--------------------------------------------------------------------------
  | Autenticação
  |--------------------------------------------------------------------------
  */

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Permission individual
  |--------------------------------------------------------------------------
  */

  if (to.meta.permission) {

    if (!auth.can(to.meta.permission)) {
      return handleUnauthorized(to)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Qualquer uma das permissions
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(to.meta.permissions)) {

    const hasPermission = auth.hasAnyPermission(
      to.meta.permissions
    )

    if (!hasPermission) {
      return handleUnauthorized(to)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Todas as permissions
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(to.meta.allPermissions)) {

    const hasPermissions = auth.hasAllPermissions(
      to.meta.allPermissions
    )

    if (!hasPermissions) {
      return handleUnauthorized(to)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Role
  |--------------------------------------------------------------------------
  */

  if (to.meta.role) {

    if (!auth.hasRole(to.meta.role)) {
      return handleUnauthorized(to)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Qualquer uma das roles
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(to.meta.roles)) {

    const hasRole = auth.hasAnyRole(
      to.meta.roles
    )

    if (!hasRole) {
      return handleUnauthorized(to)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Permissions dos módulos dinâmicos
  |--------------------------------------------------------------------------
  */

  if (to.name === 'module') {

    const module = to.params.module

    const permission = modulePermissions[module]

    if (permission && !auth.can(permission)) {
      return handleUnauthorized(to)
    }
  }

  return true
})

/*
|--------------------------------------------------------------------------
| Acesso não autorizado
|--------------------------------------------------------------------------
*/

function handleUnauthorized(to) {
  if (to.name === 'profile') {
    return false
  }

  return {
    name: 'profile',
    query: {
      forbidden: '1',
      from: to.fullPath,
    },
  }
}
export default router