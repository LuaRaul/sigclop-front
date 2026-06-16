<script setup>
defineProps({
  title: String,
  columns: Array,
  rows: Array,
  action: String,
})
</script>

<template>
  <article class="module-card">
    <header>
      <h2>{{ title }}</h2>
      <button v-if="action" class="primary-button">{{ action }}</button>
    </header>
    <div class="module-table">
      <div class="module-row module-head" :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }">
        <span v-for="column in columns" :key="column">{{ column }}</span>
      </div>
      <div
        v-for="(row, rowIndex) in rows"
        :key="rowIndex"
        class="module-row"
        :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
      >
        <span v-for="cell in row" :key="cell" :class="{ 'status-cell': ['Pendente','Em analise','Aprovado','Concluido','Concluida','Atrasada','Critico','Normal','Activo'].includes(String(cell)) }">
          {{ cell }}
        </span>
      </div>
    </div>
  </article>
</template>
