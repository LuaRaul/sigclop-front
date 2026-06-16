<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../services/api'

const report = ref(null)
const loading = ref(false)

async function load() {
  loading.value = true
  const { data } = await api.get('/reports')
  report.value = data
  loading.value = false
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header><h2>Relatorios</h2><button class="primary-button" @click="load">Actualizar</button></header>
    <div class="report-summary" v-if="report">
      <div v-for="(value, key) in report.totals" :key="key" class="summary-tile">
        <span>{{ key.replace('_', ' ') }}</span>
        <strong>{{ value }}</strong>
      </div>
    </div>
    <p v-else class="loading-line">{{ loading ? 'A carregar relatorios...' : 'Sem dados.' }}</p>
  </article>
</template>
