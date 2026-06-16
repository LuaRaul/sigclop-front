<script setup>
defineProps({
  title: String,
  total: [String, Number],
  legend: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: String,
    default: 'requests',
  },
})
</script>

<template>
  <article class="dash-card chart-card">
    <div class="card-title">
      <strong>{{ title }}</strong>
    </div>
    <div class="donut-layout">
      <div :class="['donut', `donut-${variant}`]"></div>
      <ul class="legend-list">
        <li v-for="item in legend" :key="item.label">
          <span :class="['legend-dot', item.tone]"></span>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </li>
      </ul>
    </div>
    <footer>Total: {{ total }}</footer>
  </article>
</template>
