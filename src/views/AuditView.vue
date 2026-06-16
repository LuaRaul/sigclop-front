<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../services/api'

const logs = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  const { data } = await api.get('/activity-logs')
  logs.value = data.data || data
  loading.value = false
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header><h2>Auditoria</h2><button class="primary-button" @click="load">Actualizar</button></header>
    <div class="module-table">
      <div class="module-row module-head" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>Data</span><span>Utilizador</span><span>Accao</span><span>Entidade</span><span>ID</span>
      </div>
      <div v-for="log in logs" :key="log.id" class="module-row" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>{{ log.created_at }}</span><span>{{ log.user_id || '-' }}</span><span>{{ log.action }}</span><span>{{ log.entity || '-' }}</span><span>{{ log.entity_id || '-' }}</span>
      </div>
      <p v-if="loading" class="loading-line">A carregar auditoria...</p>
    </div>
  </article>
</template>
