<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-vue-next'

import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

/*
|--------------------------------------------------------------------------
| Estado
|--------------------------------------------------------------------------
*/

const loading = ref(true)
const refreshing = ref(false)
const error = ref(null)

const dashboard = ref({
  cards: {
    documents: 0,
    requests_pending: 0,
    products: 0,
    low_stock: 0,
    distributions: 0,
  },

  recent_requests: [],
  low_stock_products: [],
})

/*
|--------------------------------------------------------------------------
| Permissões
|--------------------------------------------------------------------------
*/

const canViewDocuments = computed(() => {
  return auth.can('documentos.visualizar')
})

const canViewRequests = computed(() => {
  return auth.can('pedidos.visualizar')
})

const canViewStock = computed(() => {
  return auth.can('armazem.visualizar_stock')
})

const canViewDistribution = computed(() => {
  return auth.can('distribuicao.visualizar')
})

const canViewApprovals = computed(() => {
  return auth.hasAnyPermission([
    'pedidos.aprovar',
    'pedidos.rejeitar',
  ])
})

/*
|--------------------------------------------------------------------------
| Dados dos cartões
|--------------------------------------------------------------------------
*/

const cards = computed(() => {
  const result = []

  if (canViewDocuments.value) {
    result.push({
      key: 'documents',
      label: 'Documentos',
      value: dashboard.value.cards.documents,
      icon: FileText,
      route: '/documentos',
    })
  }

  if (canViewRequests.value) {
    result.push({
      key: 'requests_pending',
      label: 'Pedidos Pendentes',
      value: dashboard.value.cards.requests_pending,
      icon: ClipboardList,
      route: '/pedidos',
    })
  }

  if (canViewStock.value) {
    result.push({
      key: 'products',
      label: 'Produtos',
      value: dashboard.value.cards.products,
      icon: Boxes,
      route: '/stock',
    })

    result.push({
      key: 'low_stock',
      label: 'Stock Crítico',
      value: dashboard.value.cards.low_stock,
      icon: AlertTriangle,
      route: '/stock',
      critical: dashboard.value.cards.low_stock > 0,
    })
  }

  if (canViewDistribution.value) {
    result.push({
      key: 'distributions',
      label: 'Distribuições',
      value: dashboard.value.cards.distributions,
      icon: Truck,
      route: '/distribuicoes',
    })
  }

  return result
})

/*
|--------------------------------------------------------------------------
| Pedidos recentes
|--------------------------------------------------------------------------
*/

const recentRequests = computed(() => {
  return Array.isArray(dashboard.value.recent_requests)
    ? dashboard.value.recent_requests
    : []
})

/*
|--------------------------------------------------------------------------
| Produtos com stock baixo
|--------------------------------------------------------------------------
*/

const lowStockProducts = computed(() => {
  return Array.isArray(dashboard.value.low_stock_products)
    ? dashboard.value.low_stock_products
    : []
})

/*
|--------------------------------------------------------------------------
| Nome do utilizador
|--------------------------------------------------------------------------
*/

const userName = computed(() => {
  return auth.user?.name || 'Utilizador'
})

/*
|--------------------------------------------------------------------------
| Saudação
|--------------------------------------------------------------------------
*/

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Bom dia'
  }

  if (hour < 18) {
    return 'Boa tarde'
  }

  return 'Boa noite'
})

/*
|--------------------------------------------------------------------------
| Status do pedido
|--------------------------------------------------------------------------
*/

const statusConfig = {
  pendente: {
    label: 'Pendente',
    class: 'status-pending',
    icon: Loader2,
  },

  em_analise: {
    label: 'Em análise',
    class: 'status-analysis',
    icon: Loader2,
  },

  aprovado: {
    label: 'Aprovado',
    class: 'status-approved',
    icon: CheckCircle2,
  },

  rejeitado: {
    label: 'Rejeitado',
    class: 'status-rejected',
    icon: XCircle,
  },

  em_distribuicao: {
    label: 'Em distribuição',
    class: 'status-distribution',
    icon: Truck,
  },

  concluido: {
    label: 'Concluído',
    class: 'status-approved',
    icon: CheckCircle2,
  },

  cancelado: {
    label: 'Cancelado',
    class: 'status-rejected',
    icon: XCircle,
  },
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getStatus(status) {
  return (
    statusConfig[status] || {
      label: formatStatus(status),
      class: 'status-default',
      icon: ClipboardList,
    }
  )
}

function formatStatus(value) {
  if (!value) {
    return 'Sem estado'
  }

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatQuantity(value) {
  return new Intl.NumberFormat('pt-PT').format(
    Number(value || 0)
  )
}

function getRequestDescription(request) {
  if (
    Array.isArray(request?.items) &&
    request.items.length
  ) {
    const first = request.items[0]

    if (first?.product?.name) {
      if (request.items.length === 1) {
        return first.product.name
      }

      return `${first.product.name} + ${request.items.length - 1} item(ns)`
    }

    if (first?.description) {
      return first.description
    }
  }

  return request?.justification || 'Pedido interno'
}

function getRequestNumber(request) {
  return (
    request?.request_number ||
    `REQ-${request?.id ?? '—'}`
  )
}

/*
|--------------------------------------------------------------------------
| Carregar Dashboard
|--------------------------------------------------------------------------
*/

async function loadDashboard(showRefreshing = false) {
  if (showRefreshing) {
    refreshing.value = true
  } else {
    loading.value = true
  }

  error.value = null

  try {
    const response = await api.get('/dashboard')

    dashboard.value = {
      cards: {
        ...dashboard.value.cards,
        ...(response.data?.cards || {}),
      },

      recent_requests:
        response.data?.recent_requests || [],

      low_stock_products:
        response.data?.low_stock_products || [],
    }
  } catch (err) {
    error.value =
      err?.response?.data?.message ||
      'Não foi possível carregar os dados do dashboard.'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Refresh
|--------------------------------------------------------------------------
*/

async function refreshDashboard() {
  await loadDashboard(true)
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <section class="dashboard">

    <!-- ============================================================
         CABEÇALHO
         ============================================================ -->

    <div class="dashboard-header">

      <div>
        <span class="eyebrow">
          SIGCLOP
        </span>

        <h2>
          {{ greeting }}, {{ userName }}
        </h2>

        <p>
          Visão geral da gestão e controlo logístico.
        </p>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="loading || refreshing"
        @click="refreshDashboard"
      >
        <RefreshCw
          :size="17"
          :class="{ spinning: refreshing }"
        />

        <span>
          {{ refreshing ? 'A actualizar...' : 'Actualizar' }}
        </span>
      </button>

    </div>


    <!-- ============================================================
         ERRO
         ============================================================ -->

    <div
      v-if="error"
      class="error-banner"
    >
      <AlertTriangle :size="19" />

      <div>
        <strong>
          Não foi possível carregar o dashboard
        </strong>

        <span>
          {{ error }}
        </span>
      </div>

      <button
        type="button"
        @click="loadDashboard()"
      >
        Tentar novamente
      </button>
    </div>


    <!-- ============================================================
         LOADING
         ============================================================ -->

    <div
      v-if="loading"
      class="loading-state"
    >
      <Loader2
        :size="30"
        class="spinning"
      />

      <span>
        A carregar dados...
      </span>
    </div>


    <!-- ============================================================
         CONTEÚDO
         ============================================================ -->

    <template v-else>

      <!-- ==========================================================
           CARDS
           ========================================================== -->

      <div
        v-if="cards.length"
        class="stats-grid"
      >

        <router-link
          v-for="card in cards"
          :key="card.key"
          :to="card.route"
          class="stat-card"
          :class="{ critical: card.critical }"
        >

          <div class="stat-icon">
            <component
              :is="card.icon"
              :size="21"
            />
          </div>

          <div class="stat-content">

            <span class="stat-label">
              {{ card.label }}
            </span>

            <strong class="stat-value">
              {{ formatQuantity(card.value) }}
            </strong>

          </div>

          <ArrowUpRight
            :size="17"
            class="stat-arrow"
          />

        </router-link>

      </div>


      <!-- ==========================================================
           ÁREA PRINCIPAL
           ========================================================== -->

      <div class="dashboard-grid">

        <!-- ========================================================
             PEDIDOS RECENTES
             ======================================================== -->

        <section
          v-if="canViewRequests"
          class="panel requests-panel"
        >

          <div class="panel-header">

            <div>
              <span class="panel-eyebrow">
                Operação
              </span>

              <h3>
                Pedidos recentes
              </h3>
            </div>

            <router-link
              to="/pedidos"
              class="panel-link"
            >
              Ver todos
              <ArrowUpRight :size="15" />
            </router-link>

          </div>


          <div
            v-if="recentRequests.length"
            class="request-list"
          >

            <router-link
              v-for="request in recentRequests"
              :key="request.id"
              :to="{
                name: 'requests',
                query: {
                  id: request.id,
                },
              }"
              class="request-row"
            >

              <div class="request-icon">
                <ClipboardList :size="18" />
              </div>

              <div class="request-main">

                <strong>
                  {{ getRequestNumber(request) }}
                </strong>

                <span>
                  {{ getRequestDescription(request) }}
                </span>

              </div>

              <div class="request-meta">

                <span
                  class="status-badge"
                  :class="getStatus(request.status).class"
                >
                  <component
                    :is="getStatus(request.status).icon"
                    :size="13"
                  />

                  {{ getStatus(request.status).label }}
                </span>

                <small>
                  {{ formatDate(request.created_at) }}
                </small>

              </div>

            </router-link>

          </div>


          <div
            v-else
            class="empty-state"
          >
            <ClipboardList :size="28" />

            <strong>
              Nenhum pedido encontrado
            </strong>

            <span>
              Ainda não existem pedidos registados.
            </span>
          </div>

        </section>


        <!-- ========================================================
             STOCK CRÍTICO
             ======================================================== -->

        <section
          v-if="canViewStock"
          class="panel stock-panel"
        >

          <div class="panel-header">

            <div>
              <span class="panel-eyebrow">
                Armazém
              </span>

              <h3>
                Stock crítico
              </h3>
            </div>

            <router-link
              to="/stock"
              class="panel-link"
            >
              Ver stock
              <ArrowUpRight :size="15" />
            </router-link>

          </div>


          <div
            v-if="lowStockProducts.length"
            class="stock-list"
          >

            <div
              v-for="product in lowStockProducts"
              :key="product.id"
              class="stock-row"
            >

              <div class="product-icon">
                <Package :size="18" />
              </div>

              <div class="product-main">

                <strong>
                  {{ product.name }}
                </strong>

                <span>
                  SKU:
                  {{ product.sku || '—' }}
                </span>

              </div>

              <div class="stock-quantity">

                <strong>
                  {{ formatQuantity(product.quantity) }}
                </strong>

                <small>
                  mínimo:
                  {{ formatQuantity(product.minimum_quantity) }}
                </small>

              </div>

            </div>

          </div>


          <div
            v-else
            class="empty-state"
          >
            <CheckCircle2 :size="28" />

            <strong>
              Stock em níveis normais
            </strong>

            <span>
              Não existem produtos abaixo do nível mínimo.
            </span>
          </div>

        </section>

      </div>


      <!-- ==========================================================
           APROVAÇÕES
           ========================================================== -->

      <section
        v-if="canViewApprovals"
        class="quick-actions"
      >

        <div class="quick-header">

          <div>
            <span class="panel-eyebrow">
              Ação rápida
            </span>

            <h3>
              Gestão de pedidos
            </h3>
          </div>

        </div>

        <div class="quick-grid">

          <router-link
            v-if="auth.can('pedidos.aprovar')"
            to="/aprovacoes"
            class="quick-card"
          >
            <div class="quick-icon">
              <CheckCircle2 :size="20" />
            </div>

            <div>
              <strong>
                Aprovar pedidos
              </strong>

              <span>
                Rever pedidos aguardando decisão.
              </span>
            </div>

            <ArrowUpRight :size="17" />
          </router-link>


          <router-link
            v-if="auth.can('pedidos.rejeitar')"
            to="/aprovacoes"
            class="quick-card"
          >
            <div class="quick-icon">
              <XCircle :size="20" />
            </div>

            <div>
              <strong>
                Rever rejeições
              </strong>

              <span>
                Consultar e tratar pedidos.
              </span>
            </div>

            <ArrowUpRight :size="17" />
          </router-link>

        </div>

      </section>


      <!-- ==========================================================
           ESTADO SEM PERMISSÕES
           ========================================================== -->

      <div
        v-if="
          !cards.length &&
          !canViewRequests &&
          !canViewStock
        "
        class="no-access"
      >
        <ShieldAlertIcon />

        <h3>
          Dashboard limitado
        </h3>

        <p>
          O seu utilizador não possui permissões para
          visualizar os indicadores disponíveis.
        </p>
      </div>

    </template>

  </section>
</template>

<script>
/*
|--------------------------------------------------------------------------
| Ícone usado apenas no estado sem permissões.
|--------------------------------------------------------------------------
|
| Mantemos separado para não alterar a API do componente.
|--------------------------------------------------------------------------
*/

import { ShieldAlert as ShieldAlertIcon } from 'lucide-vue-next'

export default {
  components: {
    ShieldAlertIcon,
  },
}
</script>

<style scoped>
.dashboard {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 4px 0 32px;
}

/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
*/

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow,
.panel-eyebrow {
  display: block;
  margin-bottom: 5px;

  color: #6b7280;

  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dashboard-header h2 {
  margin: 0;

  color: #111827;

  font-size: 25px;
  font-weight: 800;
  line-height: 1.2;
}

.dashboard-header p {
  margin: 6px 0 0;

  color: #6b7280;

  font-size: 13px;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  min-height: 38px;

  padding: 0 13px;

  border: 1px solid #d1d5db;
  border-radius: 8px;

  background: #ffffff;
  color: #374151;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.refresh-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/*
|--------------------------------------------------------------------------
| Error
|--------------------------------------------------------------------------
*/

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 20px;
  padding: 13px 15px;

  border: 1px solid #fecaca;
  border-radius: 9px;

  background: #fef2f2;
  color: #991b1b;
}

.error-banner > div {
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-banner strong {
  font-size: 12px;
}

.error-banner span {
  color: #b91c1c;
  font-size: 11px;
}

.error-banner button {
  border: 0;
  background: transparent;
  color: #991b1b;

  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

.loading-state {
  min-height: 350px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  color: #6b7280;

  font-size: 13px;
}

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

.stats-grid {
  display: grid;

  grid-template-columns: repeat(
    auto-fit,
    minmax(180px, 1fr)
  );

  gap: 14px;

  margin-bottom: 18px;
}

.stat-card {
  position: relative;

  min-height: 112px;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 17px;

  border: 1px solid #e5e7eb;
  border-radius: 11px;

  background: #ffffff;

  text-decoration: none;

  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.02);

  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);

  border-color: #cbd5e1;

  box-shadow:
    0 7px 18px rgba(0, 0, 0, 0.06);
}

.stat-card.critical {
  border-color: #fecaca;
}

.stat-icon {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 9px;

  background: #f0fdf4;
  color: #15803d;
}

.stat-card.critical .stat-icon {
  background: #fef2f2;
  color: #dc2626;
}

.stat-content {
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #6b7280;

  font-size: 11px;
  font-weight: 600;
}

.stat-value {
  color: #111827;

  font-size: 25px;
  font-weight: 800;
  line-height: 1;
}

.stat-arrow {
  position: absolute;

  top: 15px;
  right: 15px;

  color: #9ca3af;
}

/*
|--------------------------------------------------------------------------
| Main grid
|--------------------------------------------------------------------------
*/

.dashboard-grid {
  display: grid;

  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(300px, 0.65fr);

  gap: 18px;
}

/*
|--------------------------------------------------------------------------
| Panels
|--------------------------------------------------------------------------
*/

.panel {
  min-width: 0;

  border: 1px solid #e5e7eb;
  border-radius: 11px;

  background: #ffffff;

  overflow: hidden;
}

.panel-header {
  min-height: 70px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  padding: 14px 17px;

  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3,
.quick-header h3 {
  margin: 0;

  color: #111827;

  font-size: 14px;
  font-weight: 750;
}

.panel-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  color: #166534;

  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.panel-link:hover {
  text-decoration: underline;
}

/*
|--------------------------------------------------------------------------
| Requests
|--------------------------------------------------------------------------
*/

.request-list {
  display: flex;
  flex-direction: column;
}

.request-row {
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 13px 17px;

  border-bottom: 1px solid #f3f4f6;

  color: inherit;
  text-decoration: none;
}

.request-row:last-child {
  border-bottom: 0;
}

.request-row:hover {
  background: #fafafa;
}

.request-icon,
.product-icon,
.quick-icon {
  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 8px;

  background: #f3f4f6;
  color: #4b5563;
}

.request-main {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.request-main strong {
  color: #111827;

  font-size: 12px;
}

.request-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #6b7280;

  font-size: 11px;
}

.request-meta {
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.request-meta small {
  color: #9ca3af;
  font-size: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  padding: 4px 7px;

  border-radius: 999px;

  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.status-pending {
  background: #fff7ed;
  color: #c2410c;
}

.status-analysis {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-approved {
  background: #f0fdf4;
  color: #15803d;
}

.status-rejected {
  background: #fef2f2;
  color: #b91c1c;
}

.status-distribution {
  background: #f5f3ff;
  color: #6d28d9;
}

.status-default {
  background: #f3f4f6;
  color: #4b5563;
}

/*
|--------------------------------------------------------------------------
| Stock
|--------------------------------------------------------------------------
*/

.stock-list {
  display: flex;
  flex-direction: column;
}

.stock-row {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 13px 15px;

  border-bottom: 1px solid #f3f4f6;
}

.stock-row:last-child {
  border-bottom: 0;
}

.product-icon {
  background: #fff7ed;
  color: #c2410c;
}

.product-main {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.product-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #111827;

  font-size: 11px;
}

.product-main span {
  color: #9ca3af;
  font-size: 9px;
}

.stock-quantity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stock-quantity strong {
  color: #dc2626;
  font-size: 13px;
}

.stock-quantity small {
  color: #9ca3af;
  font-size: 9px;
}

/*
|--------------------------------------------------------------------------
| Empty
|--------------------------------------------------------------------------
*/

.empty-state {
  min-height: 210px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 25px;

  color: #9ca3af;

  text-align: center;
}

.empty-state svg {
  margin-bottom: 4px;
}

.empty-state strong {
  color: #4b5563;
  font-size: 12px;
}

.empty-state span {
  max-width: 260px;
  font-size: 10px;
}

/*
|--------------------------------------------------------------------------
| Quick actions
|--------------------------------------------------------------------------
*/

.quick-actions {
  margin-top: 18px;

  padding: 17px;

  border: 1px solid #e5e7eb;
  border-radius: 11px;

  background: #ffffff;
}

.quick-header {
  margin-bottom: 13px;
}

.quick-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 10px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px;

  border: 1px solid #e5e7eb;
  border-radius: 9px;

  color: inherit;
  text-decoration: none;

  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.quick-card:hover {
  background: #fafafa;
  border-color: #d1d5db;
}

.quick-icon {
  background: #f0fdf4;
  color: #15803d;
}

.quick-card > div:nth-child(2) {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 3px;
}

.quick-card strong {
  color: #111827;
  font-size: 11px;
}

.quick-card span {
  color: #6b7280;
  font-size: 9px;
}

/*
|--------------------------------------------------------------------------
| Sem acesso
|--------------------------------------------------------------------------
*/

.no-access {
  min-height: 300px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 30px;

  border: 1px solid #e5e7eb;
  border-radius: 11px;

  background: #ffffff;

  text-align: center;
}

.no-access h3 {
  margin: 12px 0 5px;

  color: #111827;

  font-size: 15px;
}

.no-access p {
  max-width: 360px;
  margin: 0;

  color: #6b7280;
  font-size: 11px;
}

/*
|--------------------------------------------------------------------------
| Spinner
|--------------------------------------------------------------------------
*/

.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/*
|--------------------------------------------------------------------------
| Tablet
|--------------------------------------------------------------------------
*/

@media (max-width: 1050px) {

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

}

/*
|--------------------------------------------------------------------------
| Mobile
|--------------------------------------------------------------------------
*/

@media (max-width: 700px) {

  .dashboard {
    padding-bottom: 20px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-header h2 {
    font-size: 21px;
  }

  .refresh-button {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 9px;
  }

  .stat-card {
    min-height: 98px;
    padding: 12px;
  }

  .stat-icon {
    width: 35px;
    height: 35px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 9px;
  }

  .request-row {
    align-items: flex-start;
  }

  .request-meta {
    align-items: flex-end;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

}

/*
|--------------------------------------------------------------------------
| Mobile pequeno
|--------------------------------------------------------------------------
*/

@media (max-width: 430px) {

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .request-main span {
    max-width: 130px;
  }

  .status-badge {
    font-size: 8px;
  }

}
</style>