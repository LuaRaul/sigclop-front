<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'
const sectors = ref([])
const showForm = ref(false)
const saving = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(9)
const pageCount = computed(() => Math.max(1, Math.ceil(sectors.value.length / pageSize.value)))
const pagedSectors = computed(() => sectors.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const form = ref({ name: '', code: '', description: '' })
async function load() {
  try { const { data } = await api.get('/departments'); sectors.value = Array.isArray(data) ? data : (data.data || []) }
  catch (e) { error.value = e.response?.data?.message || 'Não foi possível carregar os sectores.' }
}
async function submit() {
  saving.value = true; error.value = ''
  try { await api.post('/departments', form.value); form.value = { name: '', code: '', description: '' }; showForm.value = false; await load() }
  catch (e) { error.value = e.response?.data?.message || 'Não foi possível gravar o sector.' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<template>
  <section class="module-page">
    <article class="module-card functional-card">
      <header><div><h2>Sectores</h2><p class="module-subtitle">Organização das unidades e sectores dos Serviços Prisionais.</p></div><button class="primary-button" @click="showForm = true">＋ Novo sector</button></header>
      <p v-if="error" class="form-error" style="margin:16px">{{ error }}</p>
      <div class="sector-card-grid sector-card-grid-paginated">
        <article v-for="sector in pagedSectors" :key="sector.id" class="sector-card"><div class="sector-card-top"><span class="sector-card-icon">{{ String(sector.code || sector.name || 'S').slice(0,1).toUpperCase() }}</span><span class="report-status">{{ sector.active === false ? 'Inactivo' : 'Activo' }}</span></div><h3>{{ sector.name }}</h3><p>Código: {{ sector.code || '—' }}</p><small>{{ sector.description || 'Sem descrição registada.' }}</small></article>
        <p v-if="!sectors.length" class="empty-line">Não existem sectores registados.</p>
      </div>
      <div v-if="sectors.length" class="pagination-bar"><span>{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, sectors.length) }} de {{ sectors.length }} sectores</span><div class="pagination-controls"><label>Por página <select v-model.number="pageSize" @change="page = 1"><option :value="9">9</option><option :value="18">18</option><option :value="30">30</option></select></label><button class="ghost-button" :disabled="page <= 1" @click="page--">Anterior</button><strong>{{ page }} / {{ pageCount }}</strong><button class="ghost-button" :disabled="page >= pageCount" @click="page++">Seguinte</button></div></div>
    </article>
    <Teleport to="body"><div v-if="showForm" class="modal-backdrop" @click.self="showForm = false"><section class="request-modal" role="dialog" aria-modal="true" aria-labelledby="sector-modal-title"><header class="request-modal-header"><div class="request-modal-heading-icon">＋</div><div class="request-modal-heading-copy"><h2 id="sector-modal-title">Novo sector</h2><p>Registe uma unidade ou sector institucional.</p></div><button class="modal-close-button" type="button" @click="showForm = false">×</button></header><form class="resource-form request-modal-form" @submit.prevent="submit"><label>Nome<input v-model.trim="form.name" required maxlength="150" /></label><label>Código<input v-model.trim="form.code" required maxlength="50" /></label><label class="wide">Descrição<textarea v-model="form.description" rows="3"></textarea></label><p v-if="error" class="form-error">{{ error }}</p><div class="form-actions"><button type="button" class="ghost-button" @click="showForm = false">Cancelar</button><button class="primary-button" :disabled="saving">{{ saving ? 'A gravar...' : 'Gravar sector' }}</button></div></form></section></div></Teleport>
  </section>
</template>
