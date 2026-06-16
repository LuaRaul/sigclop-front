<script setup>
import { computed, onMounted, ref } from 'vue'
import BarChart from '../components/dashboard/BarChart.vue'
import DataTable from '../components/dashboard/DataTable.vue'
import DonutChart from '../components/dashboard/DonutChart.vue'
import LineChart from '../components/dashboard/LineChart.vue'
import ReportsGrid from '../components/dashboard/ReportsGrid.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import { FileText, Archive, PackageCheck, ShieldCheck, Truck, ClipboardList } from 'lucide-vue-next'
import { api } from '../services/api'
import { activities, alerts, sectorSummary } from '../data/mockData'

const dashboard = ref(null)
const requests = ref([])
const products = ref([])
const distributions = ref([])
const documents = ref([])
const users = ref([])

const stats = computed(() => {
  const cards = dashboard.value?.cards || {}
  return [
    { label: 'Pedidos Pendentes', value: cards.requests_pending ?? 0, delta: 'actualizado pela BD', tone: 'blue', icon: FileText },
    { label: 'Stock Critico', value: cards.low_stock ?? 0, delta: 'abaixo do minimo', tone: 'orange', icon: PackageCheck },
    { label: 'Aprovacoes Pendentes', value: cards.requests_pending ?? 0, delta: 'por responsavel', tone: 'purple', icon: ShieldCheck },
    { label: 'Distribuicoes Activas', value: cards.distributions ?? 0, delta: 'registos activos', tone: 'green', icon: Truck },
    { label: 'Entradas Hoje', value: cards.products ?? 0, delta: 'produtos cadastrados', tone: 'blue', icon: Archive },
    { label: 'Saidas Hoje', value: cards.documents ?? 0, delta: 'documentos', tone: 'red', icon: ClipboardList },
  ]
})

async function loadDashboard() {
  const [dash, req, prod, dist, doc, usr] = await Promise.all([
    api.get('/dashboard'),
    api.get('/internal-requests'),
    api.get('/products'),
    api.get('/distributions'),
    api.get('/documents'),
    api.get('/users'),
  ])
  dashboard.value = dash.data
  requests.value = (req.data.data || req.data).map((item) => [
    item.request_number,
    item.department?.name || '-',
    item.submitted_at || item.created_at || '-',
    item.priority,
    item.status,
    item.approver?.name || '-',
  ])
  products.value = (prod.data.data || prod.data).map((item) => [
    item.sku,
    item.name,
    item.category?.name || '-',
    item.quantity,
    item.minimum_quantity,
    item.quantity <= item.minimum_quantity ? 'Critico' : 'Normal',
    item.supplier?.name || 'Central',
  ])
  distributions.value = (dist.data.data || dist.data).map((item) => [
    item.distribution_number,
    item.department?.name || '-',
    item.items?.length || 0,
    item.items?.reduce((total, entry) => total + Number(entry.quantity || 0), 0) || 0,
    item.created_at || '-',
    item.delivered_at || '-',
    item.status,
  ])
  documents.value = (doc.data.data || doc.data).map((item) => [
    item.reference_number || `DOC-${item.id}`,
    item.title,
    item.category?.name || '-',
    item.document_date || '-',
    item.status,
  ])
  users.value = (usr.data.data || usr.data).map((item) => [
    item.name,
    item.role,
    item.department?.name || '-',
    item.active ? 'Activo' : 'Inactivo',
    item.updated_at || '-',
  ])
}

onMounted(loadDashboard)
</script>

<template>
  <section class="page-heading">
    <h1>Dashboard</h1>
    <p>Visao geral do sistema</p>
  </section>

  <section class="dashboard-grid dashboard-grid-balanced">
    <div class="dashboard-main">
      <div class="stats-grid">
        <StatCard v-for="stat in stats" :key="stat.label" :stat="stat" />
      </div>

      <div class="chart-grid">
        <DonutChart
          title="Pedidos por Estado"
          total="540"
          variant="requests"
          :legend="[
            { label: 'Pendente', value: '128 (24%)', tone: 'blue' },
            { label: 'Em analise', value: '85 (20%)', tone: 'orange' },
            { label: 'Aprovado', value: '142 (33%)', tone: 'green' },
            { label: 'Rejeitado', value: '32 (7%)', tone: 'red' },
            { label: 'Concluido', value: '105 (24%)', tone: 'cyan' },
          ]"
        />
        <LineChart />
        <BarChart />
        <DonutChart
          title="Distribuicoes Realizadas"
          total="100"
          variant="distribution"
          :legend="[
            { label: 'Concluidas', value: '62 (62%)', tone: 'blue' },
            { label: 'Pendentes', value: '21 (21%)', tone: 'orange' },
            { label: 'Em transporte', value: '12 (12%)', tone: 'green' },
            { label: 'Atrasadas', value: '5 (5%)', tone: 'red' },
          ]"
        />
      </div>

      <div class="lower-grid">
        <DataTable title="Actividades Recentes" :columns="['Hora', 'Actividade', 'Utilizador', 'Sector', 'IP']" :rows="activities" />
        <article class="dash-card">
          <div class="card-title">
            <strong>Alertas do Sistema</strong>
          </div>
          <div class="alert-list">
            <div v-for="alert in alerts" :key="alert[0]">
              <span :class="['alert-dot', alert[2]]"></span>
              <p>{{ alert[0] }}<small>{{ alert[1] }}</small></p>
            </div>
          </div>
          <a class="panel-link" href="#">Ver todos os alertas</a>
        </article>
        <DataTable title="Resumo por Sector" :columns="['Sector', 'Pedidos', 'Consumo', 'Stock Critico']" :rows="sectorSummary" />
      </div>
    </div>
  </section>

  <section class="modules-mosaic">
    <DataTable title="Pedidos Internos" action="Novo Pedido" :columns="['Nº Pedido', 'Sector', 'Data', 'Prioridade', 'Estado', 'Responsavel']" :rows="requests" />
    <DataTable title="Gestao de Stock" action="Entrada" :columns="['Codigo', 'Produto', 'Categoria', 'Quantidade', 'Stock Min.', 'Estado', 'Armazem']" :rows="products" />
    <DataTable title="Distribuicao" :columns="['Nº Distribuicao', 'Destino', 'Produtos', 'Qtd.', 'Saida', 'Entrega', 'Estado']" :rows="distributions" />
    <DataTable title="Documentos" action="Novo Documento" :columns="['Nº Documento', 'Tipo', 'Categoria', 'Data', 'Estado']" :rows="documents" />
    <ReportsGrid />
    <DataTable title="Utilizadores" action="Novo Utilizador" :columns="['Nome', 'Funcao', 'Sector', 'Estado', 'Ultimo Acesso']" :rows="users" />
  </section>
</template>
