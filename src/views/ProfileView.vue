<script setup>
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <article class="module-card profile-card">
    <header><h2>Perfil do Utilizador</h2></header>
    <div class="profile-content">
      <div class="profile-photo">A</div>
      <dl>
        <dt>Nome:</dt><dd>{{ auth.user?.name }}</dd>
        <dt>E-mail:</dt><dd>{{ auth.user?.email }}</dd>
        <dt>Funcao:</dt><dd>{{ auth.user?.role }}</dd>
        <dt>Sector:</dt><dd>{{ auth.user?.department?.name || '-' }}</dd>
        <dt>Ultimo acesso:</dt><dd>{{ auth.user?.updated_at || '-' }}</dd>
      </dl>
      <div class="profile-actions">
        <button class="ghost-button">Alterar Palavra-passe</button>
        <button class="primary-button">Editar Perfil</button>
      </div>
    </div>
  </article>
</template>
