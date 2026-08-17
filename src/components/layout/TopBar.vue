<template>
  <header class="topbar">
    <div class="topbar-left">
      <button
        type="button"
        class="menu-button"
        aria-label="Abrir menu"
        @click="$emit('toggle-sidebar')"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="page-context">
        <h1>{{ pageTitle }}</h1>
        <span>{{ currentDate }}</span>
      </div>
    </div>

    <div class="topbar-right">
      <div class="system-status">
        <span class="status-dot"></span>
        <span>Sistema operacional</span>
      </div>

      <div class="user-area">
        <button
          type="button"
          class="user-button"
          @click="showMenu = !showMenu"
        >
          <div class="avatar">
            {{ userInitials }}
          </div>

          <div class="user-info">
            <strong>{{ userName }}</strong>
            <span>{{ userRoleLabel }}</span>
          </div>

          <svg
            class="chevron"
            :class="{ open: showMenu }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          v-if="showMenu"
          class="user-menu"
        >
          <div class="user-menu-header">
            <div class="avatar large">
              {{ userInitials }}
            </div>

            <div>
              <strong>{{ userName }}</strong>
              <span>{{ userEmail }}</span>
            </div>
          </div>

          <div class="menu-divider"></div>

          <router-link
            to="/perfil"
            class="menu-item"
            @click="showMenu = false"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>

            <span>Meu perfil</span>
          </router-link>

          <div class="menu-divider"></div>

          <button
            type="button"
            class="menu-item logout"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </svg>

            <span>
              {{ loggingOut ? 'A terminar sessão...' : 'Terminar sessão' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const showMenu = ref(false)
const loggingOut = ref(false)
const now = ref(new Date())

let clockTimer = null

const pageTitles = {
  dashboard: 'Painel de Controlo',
  requests: 'Pedidos Internos',
  approvals: 'Aprovações',
  stock: 'Gestão de Stock',
  documents: 'Gestão Documental',
  distributions: 'Distribuições',
  profile: 'Meu Perfil',
  sectores: 'Sectores',
  relatorios: 'Relatórios',
  utilizadores: 'Utilizadores',
  auditoria: 'Auditoria',
  configuracoes: 'Configurações',
}

const pageTitle = computed(() => {
  if (route.name && pageTitles[route.name]) {
    return pageTitles[route.name]
  }

  if (route.params.module && pageTitles[route.params.module]) {
    return pageTitles[route.params.module]
  }

  return 'SIGCLOP'
})

const user = computed(() => auth.user || {})

const userName = computed(() => {
  return user.value.name || 'Utilizador'
})

const userEmail = computed(() => {
  return user.value.email || ''
})

const userInitials = computed(() => {
  const name = userName.value.trim()

  if (!name) {
    return 'U'
  }

  const parts = name.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase()
})

const roleLabels = {
  director_geral: 'Director Geral',
  director: 'Director',
  funcionario: 'Funcionário',
  funcionario_armazem: 'Funcionário Armazém',
}

const userRole = computed(() => {
  if (Array.isArray(user.value.roles) && user.value.roles.length) {
    return user.value.roles[0]
  }

  return user.value.role || null
})

const userRoleLabel = computed(() => {
  return (
    roleLabels[userRole.value] ||
    userRole.value ||
    'Utilizador'
  )
})

const departmentName = computed(() => {
  return (
    user.value.department?.name ||
    'Sem sector'
  )
})

const currentDate = computed(() => {
  return now.value.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

async function handleLogout() {
  if (loggingOut.value) {
    return
  }

  loggingOut.value = true

  try {
    await auth.logout()
    showMenu.value = false
    await router.replace({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}

function handleDocumentClick(event) {
  const target = event.target

  if (!target.closest('.user-area')) {
    showMenu.value = false
  }
}

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 60 * 1000)

  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer)
  }

  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;

  height: 72px;
  padding: 0 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;

  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
}

.topbar-left {
  gap: 18px;
}

.topbar-right {
  gap: 24px;
}

.menu-button {
  width: 40px;
  height: 40px;

  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  border: 0;
  border-radius: 8px;
  background: transparent;

  cursor: pointer;
}

.menu-button:hover {
  background: #f3f4f6;
}

.menu-button span {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: #374151;
}

.page-context {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-context h1 {
  margin: 0;

  color: #111827;

  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.page-context span {
  color: #6b7280;

  font-size: 12px;
  text-transform: capitalize;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;

  color: #6b7280;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;
  background: #16a34a;

  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.user-area {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 5px 8px 5px 5px;

  border: 0;
  border-radius: 10px;
  background: transparent;

  cursor: pointer;
}

.user-button:hover {
  background: #f3f4f6;
}

.avatar {
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 50%;

  background: #008000;
  color: #ffffff;

  font-size: 13px;
  font-weight: 700;
}

.avatar.large {
  width: 44px;
  height: 44px;
}

.user-info {
  min-width: 130px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-info strong {
  color: #111827;

  font-size: 13px;
  font-weight: 700;
}

.user-info span {
  max-width: 150px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #6b7280;
  font-size: 11px;
}

.chevron {
  width: 16px;
  height: 16px;

  color: #6b7280;

  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;

  width: 270px;

  padding: 10px;

  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.04);
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 8px;
}

.user-menu-header > div:last-child {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-menu-header strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #111827;
  font-size: 13px;
}

.user-menu-header span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #6b7280;
  font-size: 11px;
}

.menu-divider {
  height: 1px;
  margin: 7px 0;

  background: #f0f0f0;
}

.menu-item {
  width: 100%;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px;

  border: 0;
  border-radius: 8px;
  background: transparent;

  color: #374151;

  font-size: 13px;
  text-decoration: none;
  text-align: left;

  cursor: pointer;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item svg {
  width: 18px;
  height: 18px;

  flex-shrink: 0;

  stroke-width: 1.8;
}

.menu-item.logout {
  color: #b91c1c;
}

.menu-item.logout:hover {
  background: #fef2f2;
}

.menu-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .topbar {
    padding: 0 16px;
  }

  .menu-button {
    display: flex;
  }

  .system-status {
    display: none;
  }

  .user-info {
    min-width: 100px;
  }
}

@media (max-width: 600px) {
  .topbar {
    height: 64px;
  }

  .page-context span {
    display: none;
  }

  .page-context h1 {
    font-size: 16px;
  }

  .user-info {
    display: none;
  }

  .user-button {
    padding-right: 2px;
  }

  .user-menu {
    position: fixed;
    top: 70px;
    right: 12px;
    left: 12px;

    width: auto;
  }
}
</style>