<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../services/api'

const products = ref([])
const movements = ref([])
const error = ref('')
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
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel registar o movimento.'
  }
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header><h2>Movimentos de Stock</h2></header>
    <form class="resource-form" @submit.prevent="submit">
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
      <div class="form-actions">
        <button class="primary-button">Registar</button>
      </div>
    </form>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="module-table">
      <div class="module-row module-head" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>Produto</span><span>Tipo</span><span>Quantidade</span><span>Saldo</span><span>Referencia</span>
      </div>
      <div v-for="movement in movements" :key="movement.id" class="module-row" style="grid-template-columns: repeat(5, minmax(0, 1fr));">
        <span>{{ movement.product?.name }}</span><span class="status-cell">{{ movement.type }}</span><span>{{ movement.quantity }}</span><span>{{ movement.balance_after }}</span><span>{{ movement.reference || '-' }}</span>
      </div>
    </div>
  </article>
</template>
