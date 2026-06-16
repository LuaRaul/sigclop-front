<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/layout/Sidebar.vue'
import TopBar from './components/layout/TopBar.vue'

const route = useRoute()
const isLogin = computed(() => route.name === 'login')
</script>

<template>
  <RouterView v-if="isLogin" v-slot="{ Component }">
    <Transition name="page-fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>

  <div v-else class="app-shell">
    <TopBar />
    <Sidebar />
    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <footer class="app-footer">
      <span>SIGCLOP - Sistema Integrado de Gestao e Controlo Logistico Prisional</span>
      <span>© 2024 Todos os direitos reservados.</span>
      <span>Versao 1.0.0</span>
    </footer>
  </div>
</template>
