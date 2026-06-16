<script setup>
import { Bell, ChevronDown, Clock3, Menu, Moon, Search, Settings } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NotificationPanel from '../dashboard/NotificationPanel.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const showNotifications = ref(false)

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="topbar">
    <div class="top-left">
      <button class="icon-button"><Menu :size="19" /></button>
      <strong class="top-title">SIGCLOP</strong>
    </div>

    <label class="global-search">
      <Search :size="17" />
      <input placeholder="Pesquisa global (pedidos, documentos, produtos...)" />
    </label>

    <div class="top-actions">
      <button class="sector-select">
        <span>Sector Actual:</span>
        <strong>Bloco A</strong>
        <ChevronDown :size="15" />
      </button>
      <div class="notification-trigger">
        <button class="icon-button has-dot" @click="showNotifications = !showNotifications"><Bell :size="18" /></button>
        <Transition name="fade-slide">
          <NotificationPanel v-if="showNotifications" class="notification-popover" />
        </Transition>
      </div>
      <button class="icon-button"><Moon :size="18" /></button>
      <button class="icon-button"><Settings :size="18" /></button>
      <button class="top-user top-user-button" @click="router.push('/perfil')">
        <div class="avatar">A</div>
        <div>
          <strong>{{ auth.user?.name || 'Administrador' }}</strong>
          <span>Administrador</span>
        </div>
      </button>
      <button class="logout-button" @click="logout">Sair</button>
      <div class="top-date">
        <span>15 de Maio de 2024</span>
        <span><Clock3 :size="14" /> 10:30:45</span>
      </div>
    </div>
  </header>
</template>
