<script setup>
import { notifications } from '../../data/mockData'
</script>

<template>
  <aside class="dash-card notifications-card">
    <div class="card-title">
      <strong>Notificacoes</strong>
      <a href="#">Marcar todas como lidas</a>
    </div>
    <div class="notification-list">
      <article v-for="item in notifications" :key="item.title" class="notification-item">
        <div :class="['notification-icon', `tone-${item.tone}`]">
          <component :is="item.icon" :size="20" />
        </div>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.body }}</p>
          <span>{{ item.time }}</span>
        </div>
      </article>
    </div>
    <a class="panel-link" href="#">Ver todas as notificacoes</a>
  </aside>
</template>
