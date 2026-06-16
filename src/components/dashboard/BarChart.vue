<template>
  <article class="dash-card chart-card">
    <div class="card-title">
      <strong>Consumo por Sector</strong>
      <span>Este mes</span>
    </div>
    <div class="bar-list">
      <div v-for="bar in bars" :key="bar.label" class="bar-row">
        <span>{{ bar.label }}</span>
        <div class="bar-track"><i :style="{ width: bar.width, background: bar.color }"></i></div>
        <strong>{{ bar.value }}</strong>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  data() {
    return {
      bars: [
        { label: 'Bloco A', value: 320, width: '94%', color: '#2563eb' },
        { label: 'Bloco B', value: 280, width: '82%', color: '#22c55e' },
        { label: 'Bloco C', value: 240, width: '70%', color: '#f59e0b' },
        { label: 'Bloco D', value: 210, width: '62%', color: '#ef4444' },
        { label: 'Oficinas', value: 180, width: '54%', color: '#8b5cf6' },
        { label: 'Saude', value: 120, width: '38%', color: '#ec4899' },
      ],
    }
  },
}
</script>
