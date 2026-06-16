<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
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

const tableRows = computed(() => rows.value
  .map((row) => ({ raw: row, cells: props.config.mapRows(row) }))
  .filter((row) => row.cells.join(' ').toLowerCase().includes(search.value.toLowerCase())))

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
})

watch(() => props.config.endpoint, () => {
  search.value = ''
  showForm.value = false
  resetForm()
  load()
})
</script>

<template>
  <article class="module-card functional-card">
    <header>
      <h2>{{ config.title }}</h2>
      <button v-if="config.action" class="primary-button" @click="showForm = !showForm">{{ config.action }}</button>
    </header>

    <div class="module-toolbar">
      <input v-model="search" :placeholder="`Pesquisar ${config.title.toLowerCase()}...`" />
      <button class="ghost-button">Filtros</button>
    </div>

    <form v-if="showForm" class="resource-form" @submit.prevent="submit">
      <label v-for="field in config.fields" :key="field.key" :class="{ wide: field.type === 'textarea' }">
        {{ field.label }}
        <textarea v-if="field.type === 'textarea'" v-model="form[field.key]" :required="field.required"></textarea>
        <select v-else-if="['select', 'product', 'department', 'approver', 'productCategory', 'documentCategory', 'supplier'].includes(field.type)" v-model="form[field.key]" :required="field.required">
          <option value="">Seleccione</option>
          <option v-for="option in optionsFor(field)" :key="option.id || option" :value="option.id || option">
            {{ option.name || option }}
          </option>
        </select>
        <input v-else v-model="form[field.key]" :type="field.type || 'text'" :required="field.required" />
      </label>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="showForm = false">Cancelar</button>
        <button class="primary-button" :disabled="saving">{{ saving ? 'A gravar...' : 'Gravar' }}</button>
      </div>
    </form>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="loading" class="loading-line">A carregar dados...</p>

    <div class="module-table">
      <div class="module-row module-head" :style="{ gridTemplateColumns: `repeat(${config.columns.length + 1}, minmax(0, 1fr))` }">
        <span v-for="column in config.columns" :key="column">{{ column }}</span>
        <span>Accoes</span>
      </div>
      <div
        v-for="row in tableRows"
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
  </article>
</template>
