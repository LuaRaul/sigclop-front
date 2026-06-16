<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../services/api'

const sectors = ref([])
const showForm = ref(false)
const form = ref({ name: '', code: '', description: '' })

async function load() {
  const { data } = await api.get('/departments')
  sectors.value = data.data || data
}

async function submit() {
  await api.post('/departments', form.value)
  form.value = { name: '', code: '', description: '' }
  showForm.value = false
  await load()
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header>
      <h2>Sectores</h2>
      <button class="primary-button" @click="showForm = !showForm">Novo Sector</button>
    </header>
    <form v-if="showForm" class="resource-form" @submit.prevent="submit">
      <label>Nome<input v-model="form.name" required /></label>
      <label>Codigo<input v-model="form.code" required /></label>
      <label class="wide">Descricao<textarea v-model="form.description"></textarea></label>
      <div class="form-actions"><button class="primary-button">Gravar</button></div>
    </form>
    <div class="sector-card-grid">
      <article v-for="sector in sectors" :key="sector.id" class="sector-card">
        <h3>{{ sector.name }}</h3>
        <p>Responsavel: {{ sector.code }}</p>
        <span>Pedidos Activos: {{ sector.id * 3 }}</span>
        <span>Consumo (Mes): {{ sector.id * 70 }}</span>
        <strong>Estado: <em>{{ sector.active ? 'Activo' : 'Inactivo' }}</em></strong>
      </article>
    </div>
  </article>
</template>
