<script setup>
import CrudPanel from '../components/dashboard/CrudPanel.vue'
import { resourceConfigs } from '../data/resourceConfigs'
</script>

<template>
  <section class="module-page">
    <CrudPanel :config="resourceConfigs.pedidos" />
  </section>
</template>
