<script setup>
import CrudPanel from '../components/dashboard/CrudPanel.vue'
import { resourceConfigs } from '../data/resourceConfigs'
</script>

<template>
  <section class="module-page">
    <div class="module-stat-strip">
      <div><span>Activas</span><strong>16</strong></div>
      <div><span>Pendentes</span><strong>8</strong></div>
      <div><span>Concluidas</span><strong>62</strong></div>
      <div><span>Atrasadas</span><strong>4</strong></div>
    </div>
    <CrudPanel :config="resourceConfigs.distribuicoes" />
  </section>
</template>
