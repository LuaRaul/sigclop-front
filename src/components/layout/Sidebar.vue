<script setup>
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

const items = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/pedidos', label: 'Pedidos Internos', icon: ClipboardList },
  { to: '/aprovacoes', label: 'Aprovacoes', icon: ClipboardCheck },
  { to: '/stock', label: 'Stock', icon: Boxes },
  { to: '/distribuicoes', label: 'Distribuicao', icon: Truck },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/sectores', label: 'Sectores', icon: Users },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3 },
  { to: '/utilizadores', label: 'Utilizadores', icon: Users },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck },
  { to: '/configuracoes', label: 'Configuracoes', icon: Settings },
]
</script>

<template>
  <aside class="sidebar">
    <nav class="side-nav">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to">
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
        <span class="nav-chevron">›</span>
      </RouterLink>
    </nav>

    <div class="side-user">
      <div class="avatar avatar-sm">A</div>
      <div>
        <strong>Administrador</strong>
        <span>Perfil Administrador</span>
      </div>
    </div>
  </aside>
</template>
