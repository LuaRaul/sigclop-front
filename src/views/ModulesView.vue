<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CrudPanel from '../components/dashboard/CrudPanel.vue'
import ReportsGrid from '../components/dashboard/ReportsGrid.vue'
import ReportsView from './ReportsView.vue'
import AuditView from './AuditView.vue'
import SectorsView from './SectorsView.vue'
import { resourceConfigs } from '../data/resourceConfigs'

const route = useRoute()
const moduleName = computed(() => route.params.module)
</script>

<template>
  <section class="module-page">
    <SectorsView v-if="moduleName === 'sectores'" />
    <CrudPanel v-else-if="moduleName === 'utilizadores'" :config="resourceConfigs.utilizadores" />
    <CrudPanel v-else-if="moduleName === 'configuracoes'" :config="resourceConfigs.configuracoes" />
    <ReportsView v-else-if="moduleName === 'relatorios'" />
    <AuditView v-else-if="moduleName === 'auditoria'" />
    <ReportsGrid v-else />
  </section>
</template>
