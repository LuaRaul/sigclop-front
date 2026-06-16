<script setup>
import { reportTiles } from '../../data/mockData'
</script>

<template>
  <article class="module-card">
    <header>
      <h2>Relatorios</h2>
      <button class="primary-button">Gerar Relatorio</button>
    </header>
    <div class="report-grid">
      <button v-for="tile in reportTiles" :key="tile.label" class="report-tile">
        <span :class="['report-icon', `tone-${tile.tone}`]"><component :is="tile.icon" :size="24" /></span>
        {{ tile.label }}
      </button>
    </div>
  </article>
</template>
