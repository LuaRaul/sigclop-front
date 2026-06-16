<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'

const requests = ref([])
const comment = ref('')
const loading = ref(false)
const error = ref('')
const auth = useAuthStore()

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/internal-requests')
    requests.value = (data.data || data).filter((item) => {
      const canSee = ['administrador', 'director'].includes(auth.user?.role) || item.assigned_approver_id === auth.user?.id
      return canSee && ['pendente', 'em_analise'].includes(item.status)
    })
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel carregar aprovacoes.'
  } finally {
    loading.value = false
  }
}

async function decide(request, decision) {
  await api.post(`/internal-requests/${request.id}/${decision}`, { comment: comment.value })
  comment.value = ''
  await load()
}

onMounted(load)
</script>

<template>
  <article class="module-card functional-card">
    <header>
      <h2>Fluxo de Aprovacao</h2>
    </header>
    <div class="approval-layout">
      <aside class="approval-list">
        <strong>Pedidos pendentes</strong>
        <p v-if="loading">A carregar...</p>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button v-for="request in requests" :key="request.id" class="approval-item">
          <span>{{ request.request_number }}</span>
          <small>{{ request.priority }} · {{ request.status }} · {{ request.approver?.name || 'Sem responsavel' }}</small>
        </button>
      </aside>
      <section class="approval-detail">
        <div v-for="request in requests" :key="request.id" class="approval-card">
          <h3>{{ request.request_number }}</h3>
          <p>{{ request.justification || 'Sem justificacao.' }}</p>
          <p><strong>Responsavel:</strong> {{ request.approver?.name || 'Nao definido' }}</p>
          <ul>
            <li v-for="item in request.items" :key="item.id">{{ item.product?.name || item.description }} - {{ item.quantity_requested }}</li>
          </ul>
          <textarea v-model="comment" placeholder="Comentario da decisao"></textarea>
          <div class="form-actions">
            <button class="primary-button success-button" @click="decide(request, 'approve')">Aprovar</button>
            <button class="primary-button reject-button" @click="decide(request, 'reject')">Rejeitar</button>
          </div>
        </div>
        <p v-if="!loading && requests.length === 0" class="empty-line">Nao existem pedidos pendentes.</p>
      </section>
    </div>
  </article>
</template>
