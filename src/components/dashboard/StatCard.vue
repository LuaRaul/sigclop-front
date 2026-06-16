<script setup>
defineProps({
  stat: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="stat-card">
    <div :class="['stat-icon', `tone-${stat.tone}`]">
      <component :is="stat.icon" :size="28" />
    </div>
    <div>
      <span>{{ stat.label }}</span>
      <strong>{{ stat.value }}</strong>
      <small>{{ stat.delta }}</small>
    </div>
  </article>
</template>
