<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, getApiErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const distributions = ref([])
const approvedRequests = ref([])
const departments = ref([])
const products = ref([])

const selected = ref(null)
const loading = ref(false)
const loadingRequests = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const showCreate = ref(false)

const form = ref({
  internal_request_id: '',
  department_id: '',
  vehicle: '',
  driver: '',
  notes: '',
  items: [],
})

const canCreate = computed(() => auth.can('distribuicao.criar'))
const canApprove = computed(() => auth.can('distribuicao.aprovar'))
const canDeliver = computed(() => auth.can('distribuicao.entregar'))
const canCancel = computed(() => auth.can('distribuicao.cancelar'))

function normalizeList(response) {
  const data = response?.data
  return Array.isArray(data) ? data : (data?.data || [])
}

function resetForm() {
  form.value = {
    internal_request_id: '',
    department_id: '',
    vehicle: '',
    driver: '',
    notes: '',
    items: [],
  }
}

function requestChanged() {
  const request = approvedRequests.value.find(
    (item) => Number(item.id) === Number(form.value.internal_request_id)
  )

  if (!request) {
    form.value.items = []
    return
  }

  form.value.department_id = request.department_id || ''

  form.value.items = (request.items || [])
    .filter((item) => Number(item.quantity_approved || 0) > 0)
    .map((item) => ({
      request_item_id: item.id,
      product_id: item.product_id,
      description: item.product?.name || item.description,
      quantity_approved: Number(item.quantity_approved || 0),
      quantity: Number(item.quantity_approved || 0),
    }))
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [distributionResponse, departmentResponse, productResponse] =
      await Promise.all([
        api.get('/distributions'),
        api.get('/departments'),
        api.get('/products'),
      ])

    distributions.value = normalizeList(distributionResponse)
    departments.value = normalizeList(departmentResponse)
    products.value = normalizeList(productResponse)
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    loading.value = false
  }
}

async function loadApprovedRequests() {
  loadingRequests.value = true

  try {
    const response = await api.get('/internal-requests', {
      params: {
        status: 'aprovado',
        per_page: 100,
      },
    })

    approvedRequests.value = normalizeList(response)
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    loadingRequests.value = false
  }
}

async function openCreate() {
  error.value = ''
  success.value = ''
  resetForm()
  showCreate.value = true
  await loadApprovedRequests()
}

function closeCreate() {
  showCreate.value = false
  resetForm()
}

async function createDistribution() {
  if (saving.value) return

  error.value = ''
  success.value = ''

  if (!form.value.internal_request_id) {
    error.value = 'Seleccione o pedido aprovado.'
    return
  }

  const items = form.value.items
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => ({
      request_item_id: Number(item.request_item_id),
      quantity: Number(item.quantity),
    }))

  if (!items.length) {
    error.value = 'Seleccione pelo menos um item.'
    return
  }

  saving.value = true

  try {
    await api.post('/distributions', {
      internal_request_id: Number(form.value.internal_request_id),
      department_id: form.value.department_id
        ? Number(form.value.department_id)
        : null,
      vehicle: form.value.vehicle || null,
      driver: form.value.driver || null,
      notes: form.value.notes || null,
      items,
    })

    success.value = 'Distribuição criada com sucesso.'
    closeCreate()
    await load()
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    saving.value = false
  }
}

async function action(distribution, operation, payload = {}) {
  if (saving.value) return

  saving.value = true
  error.value = ''
  success.value = ''

  try {
    await api.post(
      `/distributions/${distribution.id}/${operation}`,
      payload
    )

    success.value = 'Operação executada com sucesso.'
    selected.value = null
    await load()
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    saving.value = false
  }
}

async function approve(distribution) {
  await action(distribution, 'approve')
}

async function dispatch(distribution) {
  await action(distribution, 'dispatch', {
    vehicle: distribution.vehicle || null,
    driver: distribution.driver || null,
  })
}

async function deliver(distribution) {
  const receiptNumber = window.prompt(
    'Número do comprovativo/guia de entrega (opcional):',
    distribution.receipt_number || ''
  )

  if (receiptNumber === null) return

  await action(distribution, 'deliver', {
    receipt_number: receiptNumber || null,
  })
}

async function receive(distribution) {
  await action(distribution, 'receive')
}

async function confirm(distribution) {
  await action(distribution, 'confirm')
}

async function cancel(distribution) {
  const reason = window.prompt(
    'Indique o motivo do cancelamento:'
  )

  if (!reason?.trim()) return

  await action(distribution, 'cancel', {
    reason: reason.trim(),
  })
}

function statusLabel(status) {
  const labels = {
    em_preparacao: 'Em preparação',
    aprovada: 'Aprovada',
    em_transporte: 'Em transporte',
    entregue: 'Entregue',
    recebida: 'Recebida',
    cancelada: 'Cancelada',
  }

  return labels[status] || status || '-'
}

function totalQuantity(distribution) {
  return (distribution.items || []).reduce(
    (total, item) =>
      total + Number(
        item.quantity_distributed ??
        item.quantity ??
        0
      ),
    0
  )
}

function selectDistribution(distribution) {
  selected.value = distribution
}

onMounted(load)
</script>

<template>
  <section class="module-page">
    <div class="module-stat-strip">
      <div>
        <span>Activas</span>
        <strong>
          {{ distributions.filter((item) =>
            !['recebida', 'cancelada'].includes(item.status)
          ).length }}
        </strong>
      </div>

      <div>
        <span>Em transporte</span>
        <strong>
          {{ distributions.filter((item) =>
            item.status === 'em_transporte'
          ).length }}
        </strong>
      </div>

      <div>
        <span>Recebidas</span>
        <strong>
          {{ distributions.filter((item) =>
            item.status === 'recebida'
          ).length }}
        </strong>
      </div>

      <div>
        <span>Canceladas</span>
        <strong>
          {{ distributions.filter((item) =>
            item.status === 'cancelada'
          ).length }}
        </strong>
      </div>
    </div>

    <article class="module-card functional-card">
      <header>
        <div>
          <h2>Distribuições</h2>
          <p class="module-subtitle">
            Gestão do fluxo físico dos materiais.
          </p>
        </div>

        <div class="form-actions">
          <button
            v-if="canCreate"
            class="primary-button"
            @click="openCreate"
          >
            Nova Distribuição
          </button>

          <button
            class="ghost-button"
            :disabled="loading"
            @click="load"
          >
            Actualizar
          </button>
        </div>
      </header>

      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-if="success" class="success-message">{{ success }}</p>

      <form
        v-if="showCreate"
        class="resource-form"
        @submit.prevent="createDistribution"
      >
        <label class="wide">
          Pedido aprovado
          <select
            v-model="form.internal_request_id"
            required
            :disabled="loadingRequests"
            @change="requestChanged"
          >
            <option value="">
              {{ loadingRequests ? 'A carregar...' : 'Seleccione' }}
            </option>

            <option
              v-for="request in approvedRequests"
              :key="request.id"
              :value="request.id"
            >
              {{ request.request_number }} —
              {{ request.department?.name || 'Sem sector' }}
            </option>
          </select>
        </label>

        <label>
          Destino
          <select
            v-model="form.department_id"
            required
          >
            <option value="">Seleccione</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.name }}
            </option>
          </select>
        </label>

        <label>
          Viatura
          <input v-model="form.vehicle" />
        </label>

        <label>
          Motorista
          <input v-model="form.driver" />
        </label>

        <div
          v-if="form.items.length"
          class="approval-items wide"
        >
          <h4>Itens da distribuição</h4>

          <div
            v-for="item in form.items"
            :key="item.request_item_id"
            class="approval-item-row"
          >
            <div>
              <strong>{{ item.description }}</strong>
              <small>
                Aprovado: {{ item.quantity_approved }}
              </small>
            </div>

            <label>
              Quantidade
              <input
                v-model.number="item.quantity"
                type="number"
                min="0"
                :max="item.quantity_approved"
              />
            </label>
          </div>
        </div>

        <label class="wide">
          Observações
          <textarea
            v-model="form.notes"
            rows="3"
          />
        </label>

        <div class="form-actions">
          <button
            type="button"
            class="ghost-button"
            @click="closeCreate"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="primary-button"
            :disabled="saving"
          >
            {{ saving ? 'A criar...' : 'Criar distribuição' }}
          </button>
        </div>
      </form>

      <p v-if="loading" class="loading-line">
        A carregar distribuições...
      </p>

      <div class="module-table">
        <div
          class="module-row module-head"
          style="grid-template-columns: repeat(8, minmax(0, 1fr));"
        >
          <span>Nº Distribuição</span>
          <span>Destino</span>
          <span>Pedido</span>
          <span>Produtos</span>
          <span>Qtd.</span>
          <span>Estado</span>
          <span>Entrega</span>
          <span>Acções</span>
        </div>

        <div
          v-for="distribution in distributions"
          :key="distribution.id"
          class="module-row"
          style="grid-template-columns: repeat(8, minmax(0, 1fr));"
        >
          <span>
            {{ distribution.distribution_number }}
          </span>

          <span>
            {{ distribution.department?.name || '-' }}
          </span>

          <span>
            {{ distribution.request?.request_number || '-' }}
          </span>

          <span>
            {{ distribution.items?.length || 0 }}
          </span>

          <span>
            {{ totalQuantity(distribution) }}
          </span>

          <span class="status-cell">
            {{ statusLabel(distribution.status) }}
          </span>

          <span>
            {{ distribution.delivered_at || '-' }}
          </span>

          <span class="form-actions">
            <button
              class="table-action"
              @click="selectDistribution(distribution)"
            >
              Ver
            </button>

            <button
              v-if="
                canApprove &&
                distribution.status === 'em_preparacao'
              "
              class="table-action"
              :disabled="saving"
              @click="approve(distribution)"
            >
              Aprovar
            </button>

            <button
              v-if="
                canDeliver &&
                ['aprovada', 'em_preparacao'].includes(distribution.status)
              "
              class="table-action"
              :disabled="saving"
              @click="dispatch(distribution)"
            >
              Despachar
            </button>

            <button
              v-if="
                canDeliver &&
                distribution.status === 'em_transporte'
              "
              class="table-action"
              :disabled="saving"
              @click="deliver(distribution)"
            >
              Entregar
            </button>

            <button
              v-if="
                canDeliver &&
                distribution.status === 'entregue'
              "
              class="table-action"
              :disabled="saving"
              @click="receive(distribution)"
            >
              Receber
            </button>

            <button
              v-if="
                canDeliver &&
                distribution.status === 'recebida' &&
                !distribution.confirmed
              "
              class="table-action"
              :disabled="saving"
              @click="confirm(distribution)"
            >
              Confirmar
            </button>

            <button
              v-if="
                canCancel &&
                !['recebida', 'cancelada'].includes(distribution.status)
              "
              class="table-action danger-action"
              :disabled="saving"
              @click="cancel(distribution)"
            >
              Cancelar
            </button>
          </span>
        </div>

        <p
          v-if="!loading && distributions.length === 0"
          class="empty-line"
        >
          Sem distribuições.
        </p>
      </div>
    </article>

    <article
      v-if="selected"
      class="module-card functional-card"
    >
      <header>
        <div>
          <h2>{{ selected.distribution_number }}</h2>
          <p>
            {{ statusLabel(selected.status) }}
          </p>
        </div>

        <button
          class="ghost-button"
          @click="selected = null"
        >
          Fechar
        </button>
      </header>

      <div class="approval-card">
        <p>
          <strong>Pedido:</strong>
          {{ selected.request?.request_number || '-' }}
        </p>

        <p>
          <strong>Destino:</strong>
          {{ selected.department?.name || '-' }}
        </p>

        <p>
          <strong>Viatura:</strong>
          {{ selected.vehicle || '-' }}
        </p>

        <p>
          <strong>Motorista:</strong>
          {{ selected.driver || '-' }}
        </p>

        <p>
          <strong>Confirmada:</strong>
          {{ selected.confirmed ? 'Sim' : 'Não' }}
        </p>

        <h4>Itens</h4>

        <ul>
          <li
            v-for="item in selected.items || []"
            :key="item.id"
          >
            {{ item.product?.name || item.requestItem?.description || '-' }}
            —
            distribuído: {{ item.quantity_distributed ?? 0 }}
            —
            recebido: {{ item.quantity_received ?? 0 }}
          </li>
        </ul>
      </div>
    </article>
  </section>
</template>
