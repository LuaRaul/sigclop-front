<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-vue-next'

import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

/*
|--------------------------------------------------------------------------
| Navegação
|--------------------------------------------------------------------------
|
| Cada item possui a permission necessária para aparecer
| no menu.
|
*/

const items = [
  {
    to: '/',
    label: 'Dashboard',
    icon: Gauge,
    permission: 'dashboard.nacional',
  },

  {
    to: '/pedidos',
    label: 'Pedidos Internos',
    icon: ClipboardList,
    permission: 'pedidos.visualizar',
  },

  {
    to: '/aprovacoes',
    label: 'Aprovações',
    icon: ClipboardCheck,
    permissions: [
      'pedidos.aprovar',
      'pedidos.rejeitar',
    ],
  },

  {
    to: '/stock',
    label: 'Stock',
    icon: Boxes,
    permission: 'armazem.visualizar_stock',
  },

  {
    to: '/distribuicoes',
    label: 'Distribuição',
    icon: Truck,
    permission: 'distribuicao.visualizar',
  },

  {
    to: '/documentos',
    label: 'Documentos',
    icon: FileText,
    permission: 'documentos.visualizar',
  },

  {
    to: '/sectores',
    label: 'Sectores',
    icon: Users,
    permission: 'departamentos.visualizar',
  },

  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    permission: 'relatorios.visualizar',
  },

  {
    to: '/utilizadores',
    label: 'Utilizadores',
    icon: Users,
    permission: 'utilizadores.visualizar',
  },

  {
    to: '/auditoria',
    label: 'Auditoria',
    icon: ShieldCheck,
    permission: 'auditoria.visualizar',
  },

  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    permission: 'configuracoes.visualizar',
  },
]

/*
|--------------------------------------------------------------------------
| Filtrar menu por permission
|--------------------------------------------------------------------------
*/

const visibleItems = computed(() => {
  return items.filter((item) => {

    /*
    | Uma permission
    */

    if (item.permission) {
      return auth.can(item.permission)
    }

    /*
    | Qualquer uma das permissions
    */

    if (Array.isArray(item.permissions)) {
      return auth.hasAnyPermission(item.permissions)
    }

    /*
    | Sem restrição
    */

    return true
  })
})

/*
|--------------------------------------------------------------------------
| Informações do utilizador
|--------------------------------------------------------------------------
*/

const userName = computed(() => {
  return auth.userName || 'Utilizador'
})

const roleLabel = computed(() => {
  return auth.roleLabel || 'Utilizador'
})

const initials = computed(() => {
  const name = userName.value.trim()

  if (!name) {
    return 'U'
  }

  const parts = name.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase()
})

const departmentName = computed(() => {
  return auth.departmentName || 'Sem departamento'
})
</script>

<template>
  <aside class="sidebar">

    <!--
    |--------------------------------------------------------------------------
    | Navegação
    |--------------------------------------------------------------------------
    -->

    <nav class="side-nav">

      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
      >
        <component
          :is="item.icon"
          :size="18"
        />

        <span>
          {{ item.label }}
        </span>

        <span class="nav-chevron">
          ›
        </span>
      </RouterLink>

      <!--
      | Estado sem permissões
      -->

      <div
        v-if="visibleItems.length === 0"
        class="nav-empty"
      >
        <span>
          Nenhum módulo disponível.
        </span>
      </div>

    </nav>

    <!--
    |--------------------------------------------------------------------------
    | Utilizador autenticado
    |--------------------------------------------------------------------------
    -->

    <div class="side-user">

      <div class="avatar avatar-sm">
        {{ initials }}
      </div>

      <div class="side-user-info">

        <strong>
          {{ userName }}
        </strong>

        <span>
          {{ roleLabel }}
        </span>

        <small v-if="departmentName">
          {{ departmentName }}
        </small>

      </div>

    </div>

  </aside>
</template>