<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../services/api'

const products = ref([])
const movements = ref([])
const error = ref('')
const showForm = ref(false)
const page = ref(1)
const pageSize = ref(10)
const pageCount = computed(() => Math.max(1, Math.ceil(movements.value.length / pageSize.value)))
const pagedMovements = computed(() => movements.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const form = reactive({
  product_id: '',
  type: 'entrada',
  quantity: 1,
  reference: '',
  notes: '',
})

async function load() {
  const [{ data: lookups }, { data: movementData }] = await Promise.all([
    api.get('/lookups'),
    api.get('/stock-movements'),
  ])
  products.value = lookups.products || []
  movements.value = movementData.data || movementData
}

async function submit() {
  error.value = ''
  try {
    await api.post('/stock-movements', {
      ...form,
      product_id: Number(form.product_id),
      quantity: Number(form.quantity),
    })
    form.quantity = 1
    form.reference = ''
    form.notes = ''
    showForm.value = false
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel registar o movimento.'
  }
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header><h2>Movimentos de Stock</h2><button class="primary-button" @click="showForm = true">+ Novo movimento</button></header>
    <Teleport to="body"><div v-if="showForm" class="modal-backdrop" @click.self="showForm = false"><section class="request-modal" role="dialog" aria-modal="true"><header class="request-modal-header"><div class="request-modal-heading-icon">＋</div><div class="request-modal-heading-copy"><h2>Novo movimento de stock</h2><p>Registe uma entrada, saída ou ajuste.</p></div><button class="modal-close-button" type="button" @click="showForm = false">×</button></header><form class="resource-form request-modal-form" @submit.prevent="submit">
      <label>
        Produto
        <select v-model="form.product_id" required>
          <option value="">Seleccione</option>
          <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
        </select>
      </label>
      <label>
        Tipo
        <select v-model="form.type">
          <option value="entrada">Entrada</option>
          <option value="saida">Saida</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </label>
      <label>
        Quantidade
        <input v-model="form.quantity" type="number" min="1" required />
      </label>
      <label>
        Referencia
        <input v-model="form.reference" />
      </label>
      <label class="wide">
        Observacoes
        <textarea v-model="form.notes"></textarea>
      </label>
      <div class="form-actions"><button type="button" class="ghost-button" @click="showForm = false">Cancelar</button><button class="primary-button">Registar</button></div>
    </form></section></div></Teleport>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="module-table">
      <div class="module-row module-head" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>Produto</span><span>Tipo</span><span>Quantidade</span><span>Saldo</span><span>Referencia</span>
      </div>
      <div v-for="movement in pagedMovements" :key="movement.id" class="module-row" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>{{ movement.product?.name }}</span><span class="status-cell">{{ movement.type }}</span><span>{{ movement.quantity }}</span><span>{{ movement.balance_after }}</span><span>{{ movement.reference || '-' }}</span>
      </div>
    </div>
    <div v-if="movements.length" class="pagination-bar"><span>{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, movements.length) }} de {{ movements.length }} movimentos</span><div class="pagination-controls"><label>Linhas <select v-model.number="pageSize" @change="page = 1"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label><button class="ghost-button" :disabled="page <= 1" @click="page--">Anterior</button><strong>{{ page }} / {{ pageCount }}</strong><button class="ghost-button" :disabled="page >= pageCount" @click="page++">Seguinte</button></div></div>
  </article>
</template>
