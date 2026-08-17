<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, getApiErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const requests = ref([])
const selectedRequestId = ref(null)
const loading = ref(false)
const deciding = ref(false)
const error = ref('')
const success = ref('')
const comment = ref('')

const selectedRequest = computed(() =>
  requests.value.find((item) => item.id === selectedRequestId.value) || null
)

function normalizeList(response) {
  const data = response?.data
  return Array.isArray(data) ? data : (data?.data || [])
}

function canApprove() {
  return auth.can('pedidos.aprovar')
}

function canReject() {
  return auth.can('pedidos.rejeitar')
}

function canForward() {
  return auth.can('pedidos.reencaminhar')
}

function selectRequest(request) {
  selectedRequestId.value = request.id
  comment.value = ''
  error.value = ''
  success.value = ''
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/approvals/pending')
    requests.value = normalizeList(response)

    if (
      selectedRequestId.value &&
      !requests.value.some((item) => item.id === selectedRequestId.value)
    ) {
      selectedRequestId.value = null
    }

    if (!selectedRequestId.value && requests.value.length) {
      selectedRequestId.value = requests.value[0].id
    }
  } catch (exception) {
    requests.value = []
    error.value = getApiErrorMessage(exception)
  } finally {
    loading.value = false
  }
}

function approvalPayload(request) {
  return {
    comment: comment.value || null,
    items: (request.items || []).map((item) => ({
      request_item_id: item.id,
      quantity_approved: Number(
        item.quantity_approved ?? item.quantity_requested ?? 0
      ),
    })),
  }
}

async function decide(request, decision) {
  if (deciding.value) return

  if (decision === 'reject' && !comment.value.trim()) {
    error.value = 'Informe o motivo da rejeição.'
    return
  }

  deciding.value = true
  error.value = ''
  success.value = ''

  try {
    const endpoint = decision === 'approve'
      ? `/approvals/internal-request/${request.id}/approve`
      : `/approvals/internal-request/${request.id}/reject`

    const payload = decision === 'approve'
      ? approvalPayload(request)
      : { comment: comment.value.trim() }

    await api.post(endpoint, payload)

    success.value = decision === 'approve'
      ? 'Pedido aprovado com sucesso.'
      : 'Pedido rejeitado com sucesso.'

    comment.value = ''
    selectedRequestId.value = null

    await load()
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    deciding.value = false
  }
}

async function forward(request) {
  if (deciding.value) return

  error.value = ''
  success.value = ''

  const approverId = window.prompt(
    'Informe o ID do novo responsável pela aprovação.'
  )

  if (!approverId) return

  deciding.value = true

  try {
    await api.post(
      `/approvals/internal-request/${request.id}/forward`,
      {
        assigned_approver_id: Number(approverId),
        comment: comment.value || null,
      }
    )

    success.value = 'Pedido reencaminhado com sucesso.'
    comment.value = ''
    selectedRequestId.value = null

    await load()
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
  } finally {
    deciding.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="module-page">
    <article class="module-card functional-card">
      <header>
        <div>
          <h2>Fluxo de Aprovação</h2>
          <p class="module-subtitle">
            Pedidos internos que aguardam decisão.
          </p>
        </div>

        <button
          class="ghost-button"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? 'A carregar...' : 'Actualizar' }}
        </button>
      </header>

      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-if="success" class="success-message">{{ success }}</p>

      <div class="approval-layout">
        <aside class="approval-list">
          <strong>Pedidos pendentes</strong>

          <p v-if="loading">A carregar...</p>

          <button
            v-for="request in requests"
            :key="request.id"
            type="button"
            class="approval-item"
            :class="{ active: request.id === selectedRequestId }"
            @click="selectRequest(request)"
          >
            <span>{{ request.request_number }}</span>
            <small>
              {{ request.priority }} ·
              {{ request.status }} ·
              {{ request.approver?.name || 'Sem responsável' }}
            </small>
          </button>

          <p
            v-if="!loading && requests.length === 0"
            class="empty-line"
          >
            Não existem pedidos pendentes.
          </p>
        </aside>

        <section class="approval-detail">
          <div
            v-if="selectedRequest"
            class="approval-card"
          >
            <div class="approval-card-header">
              <div>
                <h3>{{ selectedRequest.request_number }}</h3>
                <p>
                  {{ selectedRequest.department?.name || 'Sem sector' }}
                  ·
                  {{ selectedRequest.requester?.name || 'Sem solicitante' }}
                </p>
              </div>

              <span class="status-cell">
                {{ selectedRequest.status }}
              </span>
            </div>

            <p>
              <strong>Prioridade:</strong>
              {{ selectedRequest.priority }}
            </p>

            <p>
              <strong>Justificação:</strong>
              {{ selectedRequest.justification || 'Sem justificação.' }}
            </p>

            <p>
              <strong>Responsável:</strong>
              {{ selectedRequest.approver?.name || 'Não definido' }}
            </p>

            <div class="approval-items">
              <h4>Itens solicitados</h4>

              <div
                v-for="item in selectedRequest.items || []"
                :key="item.id"
                class="approval-item-row"
              >
                <div>
                  <strong>
                    {{ item.product?.name || item.description }}
                  </strong>
                  <small>
                    Solicitado: {{ item.quantity_requested }}
                  </small>
                </div>

                <label>
                  Aprovar
                  <input
                    v-model.number="item.quantity_approved"
                    type="number"
                    min="0"
                    :max="item.quantity_requested"
                  />
                </label>
              </div>
            </div>

            <textarea
              v-model="comment"
              placeholder="Comentário da decisão"
              rows="4"
            />

            <div class="form-actions">
              <button
                v-if="canApprove()"
                class="primary-button success-button"
                :disabled="deciding"
                @click="decide(selectedRequest, 'approve')"
              >
                {{ deciding ? 'A processar...' : 'Aprovar' }}
              </button>

              <button
                v-if="canReject()"
                class="primary-button reject-button"
                :disabled="deciding"
                @click="decide(selectedRequest, 'reject')"
              >
                Rejeitar
              </button>

              <button
                v-if="canForward()"
                class="ghost-button"
                :disabled="deciding"
                @click="forward(selectedRequest)"
              >
                Reencaminhar
              </button>
            </div>
          </div>

          <p
            v-else-if="!loading"
            class="empty-line"
          >
            Seleccione um pedido para consultar os detalhes.
          </p>
        </section>
      </div>
    </article>
  </section>
</template>
