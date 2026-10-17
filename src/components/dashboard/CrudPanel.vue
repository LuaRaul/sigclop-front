<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { createResource, deleteResource, getResource, listResource } from '../../services/resources'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
})

const rows = ref([])
const lookups = ref({ departments: [], products: [] })
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const showForm = ref(false)
const search = ref('')
const form = reactive({})
const isRequestForm = computed(() => props.config.endpoint === '/internal-requests')
const page = ref(1)
const pageSize = ref(10)
const pageCount = computed(() => Math.max(1, Math.ceil(tableRows.value.length / pageSize.value)))
const paginatedRows = computed(() => tableRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function closeRequestModal() {
  if (saving.value) return
  showForm.value = false
  error.value = ''
}

function handleEscape(event) {
  if (event.key === 'Escape' && showForm.value && !saving.value) {
    showForm.value = false
    error.value = ''
  }
}

const tableRows = computed(() => rows.value
  .map((row) => ({ raw: row, cells: props.config.mapRows(row) }))
  .filter((row) => row.cells.join(' ').toLowerCase().includes(search.value.toLowerCase())))
watch(search, () => { page.value = 1 })

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key])
  props.config.fields?.forEach((field) => {
    form[field.key] = field.default ?? ''
  })
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    rows.value = await listResource(props.config.endpoint)
    lookups.value = await getResource('/lookups')
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel carregar os dados.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  error.value = ''

  try {
    const payload = props.config.toPayload ? props.config.toPayload(form) : { ...form }
    await createResource(props.config.endpoint, payload)
    showForm.value = false
    resetForm()
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel gravar o registo.'
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!row.id) return
  await deleteResource(props.config.endpoint, row.id)
  await load()
}

function optionValue(option) {
  if (option && typeof option === 'object') return option.value ?? option.id ?? option.code ?? option.name
  return option
}

function optionLabel(option) {
  if (option && typeof option === 'object') return option.label ?? option.name ?? option.title ?? String(optionValue(option) ?? '')
  return option
}

function optionsFor(field) {
  if (field.type === 'product') return lookups.value.products || []
  if (field.type === 'department') return lookups.value.departments || []
  if (field.type === 'approver') return lookups.value.approval_users || []
  if (field.type === 'productCategory') return lookups.value.product_categories || []
  if (field.type === 'documentCategory') return lookups.value.document_categories || []
  if (field.type === 'supplier') return lookups.value.suppliers || []
  return field.options || []
}

onMounted(() => {
  resetForm()
  load()
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

watch(() => props.config.endpoint, () => {
  search.value = ''
  page.value = 1
  showForm.value = false
  resetForm()
  load()
})
</script>

<template>
  <article class="module-card functional-card">
    <header>
      <h2>{{ config.title }}</h2>
      <button v-if="config.action" class="primary-button new-record-button" @click="showForm = !showForm; error = ''">
        <span class="button-plus" aria-hidden="true">+</span>{{ config.action }}
      </button>
    </header>

    <div class="module-toolbar">
      <input v-model="search" :placeholder="`Pesquisar ${config.title.toLowerCase()}...`" />
      <button class="ghost-button">Filtros</button>
    </div>

    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="closeRequestModal">
        <section class="request-modal" role="dialog" aria-modal="true" :aria-labelledby="'resource-modal-title'">
          <header class="request-modal-header">
            <div class="request-modal-heading-icon" aria-hidden="true">＋</div>
            <div class="request-modal-heading-copy">
              <h2 id="resource-modal-title">{{ config.action || 'Novo registo' }}</h2>
              <p>{{ isRequestForm ? 'Preencha os dados para submeter um pedido.' : `Preencha os dados para registar ${config.title.toLowerCase()}.` }}</p>
            </div>
            <button class="modal-close-button" type="button" aria-label="Fechar" :disabled="saving" @click="closeRequestModal">×</button>
          </header>
          <form class="resource-form request-modal-form" @submit.prevent="submit">
            <label v-for="field in config.fields" :key="field.key" :class="{ wide: field.type === 'textarea' || field.key === 'department_id' || field.key === 'assigned_approver_id' }">
              {{ field.label }}<span v-if="field.required" class="required-mark">*</span>
              <textarea v-if="field.type === 'textarea'" v-model="form[field.key]" :required="field.required" :placeholder="field.label.toLowerCase().includes('justifica') ? 'Explique a necessidade deste registo...' : ''"></textarea>
              <select v-else-if="['select', 'product', 'department', 'approver', 'productCategory', 'documentCategory', 'supplier'].includes(field.type)" v-model="form[field.key]" :required="field.required">
                <option value="">Seleccione {{ field.label.toLowerCase() }}</option>
                <option v-for="option in optionsFor(field)" :key="optionValue(option)" :value="optionValue(option)">{{ optionLabel(option) }}</option>
              </select>
              <input v-else v-model="form[field.key]" :type="field.type || 'text'" :required="field.required" :min="field.type === 'number' ? 1 : undefined" />
            </label>
            <p v-if="error" class="form-error modal-form-error">{{ error }}</p>
            <div class="form-actions request-modal-actions">
              <span class="form-required-note"><span class="required-mark">*</span> Campos obrigatórios</span>
              <div class="modal-action-buttons">
                <button class="ghost-button" type="button" :disabled="saving" @click="closeRequestModal">Cancelar</button>
                <button class="primary-button save-request-button" :disabled="saving">{{ saving ? 'A gravar...' : (isRequestForm ? 'Submeter pedido' : 'Gravar') }}</button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </Teleport>

    <p v-if="error && !(showForm && isRequestForm)" class="form-error">{{ error }}</p>
    <p v-if="loading" class="loading-line">A carregar dados...</p>

    <div class="module-table">
      <div class="module-row module-head" :style="{ gridTemplateColumns: `repeat(${config.columns.length + 1}, minmax(0, 1fr))` }">
        <span v-for="column in config.columns" :key="column">{{ column }}</span>
        <span>Accoes</span>
      </div>
      <div
        v-for="row in paginatedRows"
        :key="row.raw.id"
        class="module-row"
        :style="{ gridTemplateColumns: `repeat(${config.columns.length + 1}, minmax(0, 1fr))` }"
      >
        <span v-for="cell in row.cells" :key="cell" :class="{ 'status-cell': ['pendente','em_analise','aprovado','rejeitado','concluido','entregue','cancelada','Activo','Normal','Critico'].includes(String(cell)) }">
          {{ cell }}
        </span>
        <button class="table-action danger-action" @click="remove(row.raw)">Remover</button>
      </div>
      <p v-if="!loading && tableRows.length === 0" class="empty-line">Sem registos.</p>
    </div>
    <div v-if="tableRows.length" class="pagination-bar">
      <span>{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, tableRows.length) }} de {{ tableRows.length }} registos</span>
      <div class="pagination-controls">
        <label>Linhas <select v-model.number="pageSize" @change="page = 1"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label>
        <button class="ghost-button" :disabled="page <= 1" @click="page--">Anterior</button>
        <strong>{{ page }} / {{ pageCount }}</strong>
        <button class="ghost-button" :disabled="page >= pageCount" @click="page++">Seguinte</button>
      </div>
    </div>
  </article>
</template>
