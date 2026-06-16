<script setup>
import CrudPanel from '../components/dashboard/CrudPanel.vue'
import StockMovementPanel from '../components/dashboard/StockMovementPanel.vue'
import { resourceConfigs } from '../data/resourceConfigs'
</script>

<template>
  <section class="module-page stock-functional-page">
    <div class="module-stat-strip">
      <div><span>Total de Produtos</span><strong>320</strong></div>
      <div><span>Produtos Criticos</span><strong>23</strong></div>
      <div><span>Entradas Hoje</span><strong>48</strong></div>
      <div><span>Saidas Hoje</span><strong>36</strong></div>
    </div>
    <CrudPanel :config="resourceConfigs.stock" />
    <StockMovementPanel />
  </section>
</template>
