<script setup>
import { computed, onMounted, ref } from 'vue'
import { Download, FileSpreadsheet, FileText, RefreshCw, Package, ClipboardList, Truck, AlertTriangle, Users, Building2 } from 'lucide-vue-next'
import { api, getApiErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const canExport = computed(() => auth.can('relatorios.exportar'))
const report = ref(null)
const stockPage = ref(1)
const distributionPage = ref(1)
const reportPageSize = 5
const pagedLowStock = computed(() => (report.value?.low_stock_products || []).slice((stockPage.value - 1) * reportPageSize, stockPage.value * reportPageSize))
const pagedDistributions = computed(() => (report.value?.recent_distributions || []).slice((distributionPage.value - 1) * reportPageSize, distributionPage.value * reportPageSize))
const stockPages = computed(() => Math.max(1, Math.ceil((report.value?.low_stock_products || []).length / reportPageSize)))
const distributionPages = computed(() => Math.max(1, Math.ceil((report.value?.recent_distributions || []).length / reportPageSize)))
const loading = ref(false)
const error = ref('')
const exportedAt = ref('')

const metricCards = computed(() => {
  const totals = report.value?.totals || {}
  const definitions = [
    ['pedidos', 'Pedidos', ClipboardList], ['aprovados', 'Aprovados', FileText],
    ['pendentes', 'Pendentes', AlertTriangle], ['produtos', 'Produtos', Package],
    ['stock_critico', 'Stock crítico', AlertTriangle], ['distribuicoes', 'Distribuições', Truck],
    ['documentos', 'Documentos', FileText], ['sectores', 'Sectores', Building2], ['utilizadores', 'Utilizadores', Users],
  ]
  return definitions.map(([key, label, icon]) => ({ key, label, value: totals[key] ?? 0, icon }))
})
const statusTotal = computed(() => (report.value?.requests_by_status || []).reduce((sum, item) => sum + Number(item.total || 0), 0))
const movementTotal = computed(() => (report.value?.stock_movements_by_type || []).reduce((sum, item) => sum + Number(item.total || 0), 0))
function percent(value, total) { return total ? Math.round(Number(value || 0) * 100 / total) : 0 }
function labelize(value) { return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }
async function load() {
  loading.value = true; error.value = ''
  try { const { data } = await api.get('/reports'); report.value = data; exportedAt.value = new Date().toLocaleString('pt-PT') }
  catch (e) { error.value = getApiErrorMessage(e) }
  finally { loading.value = false }
}
function csvCell(value) { const s = String(value ?? ''); return `"${s.replaceAll('"', '""')}"` }
function exportCsv() {
  if (!report.value) return
  const rows = [['Secção', 'Indicador', 'Valor']]
  Object.entries(report.value.totals || {}).forEach(([key, value]) => rows.push(['Resumo', labelize(key), value]))
  ;(report.value.requests_by_status || []).forEach(item => rows.push(['Pedidos por estado', labelize(item.status), item.total]))
  ;(report.value.stock_movements_by_type || []).forEach(item => rows.push(['Movimentos de stock', labelize(item.type), `${item.total} movimentos; quantidade ${item.quantity ?? 0}`]))
  rows.push([], ['Produtos com stock crítico', 'Produto', 'Stock', 'Stock mínimo'])
  ;(report.value.low_stock_products || []).forEach(item => rows.push(['Stock crítico', item.name, item.quantity, item.minimum_quantity]))
  rows.push([], ['Distribuições recentes', 'Número', 'Estado', 'Data'])
  ;(report.value.recent_distributions || []).forEach(item => rows.push(['Distribuições', item.distribution_number, item.status, item.created_at]))
  const csv = '\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a'); a.href = url; a.download = `sigclop-relatorio-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
}
function exportPdf() { window.print() }
onMounted(load)
</script>

<template>
  <section class="module-page reports-page">
    <article class="module-card functional-card reports-hero">
      <div class="reports-hero-copy"><span class="reports-eyebrow">SIGCLOP · INTELIGÊNCIA OPERACIONAL</span><h2>Relatórios e indicadores</h2><p>Visão consolidada de pedidos, materiais, stock e distribuição dos Serviços Prisionais.</p><small v-if="exportedAt">Dados actualizados em {{ exportedAt }}</small></div>
      <div class="reports-toolbar no-print"><button class="ghost-button" :disabled="loading" @click="load"><RefreshCw :size="16"/> Actualizar</button><button v-if="canExport" class="ghost-button" :disabled="!report" @click="exportCsv"><FileSpreadsheet :size="16"/> Exportar CSV</button><button v-if="canExport" class="primary-button" :disabled="!report" @click="exportPdf"><FileText :size="16"/> Exportar PDF</button></div>
    </article>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="loading && !report" class="loading-line">A carregar indicadores...</p>
    <template v-if="report">
      <div class="reports-metric-grid">
        <article v-for="(card, index) in metricCards" :key="card.key" class="report-metric-card" :class="{ 'metric-warning': card.key === 'stock_critico' && card.value > 0 }"><div class="report-metric-top"><span>{{ card.label }}</span><component :is="card.icon" :size="19"/></div><strong>{{ Number(card.value).toLocaleString('pt-PT') }}</strong><small>{{ card.key === 'stock_critico' ? 'Produtos que requerem atenção' : 'Registos no sistema' }}</small></article>
      </div>
      <div class="reports-content-grid">
        <article class="report-panel"><header><div><h3>Pedidos por estado</h3><p>Distribuição dos pedidos registados</p></div><span class="report-total">{{ statusTotal }} total</span></header><div v-if="report.requests_by_status?.length" class="report-bars"><div v-for="item in report.requests_by_status" :key="item.status" class="report-bar-row"><div class="report-bar-label"><span>{{ labelize(item.status) }}</span><strong>{{ item.total }}</strong></div><div class="report-bar-track"><span :style="{ width: `${percent(item.total, statusTotal)}%` }"></span></div></div></div><p v-else class="empty-line">Sem dados de pedidos.</p></article>
        <article class="report-panel"><header><div><h3>Movimentos de stock</h3><p>Quantidade de operações por tipo</p></div><span class="report-total">{{ movementTotal }} movimentos</span></header><div v-if="report.stock_movements_by_type?.length" class="report-bars"><div v-for="item in report.stock_movements_by_type" :key="item.type" class="report-bar-row"><div class="report-bar-label"><span>{{ labelize(item.type) }}</span><strong>{{ item.total }} <small>({{ Number(item.quantity || 0).toLocaleString('pt-PT') }} un.)</small></strong></div><div class="report-bar-track gold"><span :style="{ width: `${percent(item.total, movementTotal)}%` }"></span></div></div></div><p v-else class="empty-line">Sem movimentos registados.</p></article>
      </div>
      <div class="reports-content-grid">
        <article class="report-panel"><header><div><h3>Stock crítico</h3><p>Produtos com quantidade igual ou inferior ao mínimo</p></div><span class="report-pill warning">{{ report.low_stock_products?.length || 0 }} produtos</span></header><div class="report-table-wrap"><table class="report-table"><thead><tr><th>Produto</th><th>Stock actual</th><th>Stock mínimo</th></tr></thead><tbody><tr v-for="product in pagedLowStock" :key="product.id"><td><strong>{{ product.name }}</strong><small>{{ product.code || `#${product.id}` }}</small></td><td><span class="report-stock-value">{{ product.quantity }}</span></td><td>{{ product.minimum_quantity }}</td></tr><tr v-if="!report.low_stock_products?.length"><td colspan="3" class="empty-line">Não existem produtos em stock crítico.</td></tr></tbody></table></div><div v-if="(report.low_stock_products || []).length > reportPageSize" class="pagination-bar report-pagination"><span>Página {{ stockPage }} de {{ stockPages }}</span><div class="pagination-controls"><button class="ghost-button" :disabled="stockPage <= 1" @click="stockPage--">Anterior</button><button class="ghost-button" :disabled="stockPage >= stockPages" @click="stockPage++">Seguinte</button></div></div></article>
        <article class="report-panel"><header><div><h3>Distribuições recentes</h3><p>Últimos movimentos de distribuição</p></div><span class="report-pill">{{ report.recent_distributions?.length || 0 }} registos</span></header><div class="report-table-wrap"><table class="report-table"><thead><tr><th>Referência</th><th>Estado</th><th>Data</th></tr></thead><tbody><tr v-for="distribution in pagedDistributions" :key="distribution.id"><td><strong>{{ distribution.distribution_number || `#${distribution.id}` }}</strong></td><td><span class="report-status">{{ labelize(distribution.status) }}</span></td><td>{{ distribution.created_at ? new Date(distribution.created_at).toLocaleDateString('pt-PT') : '—' }}</td></tr><tr v-if="!report.recent_distributions?.length"><td colspan="3" class="empty-line">Sem distribuições recentes.</td></tr></tbody></table></div><div v-if="(report.recent_distributions || []).length > reportPageSize" class="pagination-bar report-pagination"><span>Página {{ distributionPage }} de {{ distributionPages }}</span><div class="pagination-controls"><button class="ghost-button" :disabled="distributionPage <= 1" @click="distributionPage--">Anterior</button><button class="ghost-button" :disabled="distributionPage >= distributionPages" @click="distributionPage++">Seguinte</button></div></div></article>
      </div>
      <footer class="reports-footer"><span>Serviço Penitenciário de Angola · SIGCLOP</span><span>Relatório gerado em {{ exportedAt }}</span></footer>
    </template>
  </section>
</template>
