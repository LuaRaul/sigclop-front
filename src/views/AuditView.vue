<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'

const logs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const pageCount = computed(() => Math.max(1, Math.ceil(logs.value.length / pageSize.value)))
const pagedLogs = computed(() => logs.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

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
      <div v-for="log in pagedLogs" :key="log.id" class="module-row" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>{{ log.created_at }}</span><span>{{ log.user_id || '-' }}</span><span>{{ log.action }}</span><span>{{ log.entity || '-' }}</span><span>{{ log.entity_id || '-' }}</span>
      </div>
      <p v-if="loading" class="loading-line">A carregar auditoria...</p>
    </div>
    <div v-if="logs.length" class="pagination-bar"><span>{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, logs.length) }} de {{ logs.length }} registos</span><div class="pagination-controls"><label>Linhas <select v-model.number="pageSize" @change="page = 1"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label><button class="ghost-button" :disabled="page <= 1" @click="page--">Anterior</button><strong>{{ page }} / {{ pageCount }}</strong><button class="ghost-button" :disabled="page >= pageCount" @click="page++">Seguinte</button></div></div>
  </article>
</template>
