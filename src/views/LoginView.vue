<script setup>
import { Eye, Lock, User } from "lucide-vue-next";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

import logoSPA from "../assets/images/logo-spa.png";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");

const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";

  try {
    await auth.login(email.value, password.value);
    router.push("/");
  } catch (exception) {
    error.value = exception.response?.data?.message || "Não foi possível iniciar sessão.";
  } finally {
    loading.value = false;
  }
}
</script>
<style></style>
<template>
  <main class="login-screen">
    <div class="login-overlay"></div>

    <section class="login-container">
      <div class="login-brand">
        <img :src="logoSPA" alt="Serviço Penitenciário de Angola" class="login-logo" />

        <h1>Serviço Penitenciário de Angola</h1>

        <div class="login-divider"></div>

        <h2 class="system-name">SIGCLOP</h2>

        <p class="system-description">
          Sistema Integrado de Gestão e Controlo Logístico Prisional
        </p>
      </div>

      <form class="login-card" @submit.prevent="submit">
        <div class="card-header">
          <h3>Autenticação</h3>
          <span>Acesso Restrito</span>
        </div>

        <label>
          Utilizador
          <span class="input-wrap">
            <User :size="18" />
            <input
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="Introduza o seu email"
            />
          </span>
        </label>

        <label>
          Palavra-passe
          <span class="input-wrap">
            <Lock :size="18" />
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Introduza a sua palavra-passe"
            />
            <Eye :size="16" />
          </span>
        </label>

        <div class="login-actions">
          <a href="#" class="forgot-password"> Recuperar acesso </a>
        </div>

        <p v-if="error" class="login-error">
          {{ error }}
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? "A autenticar..." : "ENTRAR NO SISTEMA" }}
        </button>

        <div class="security-note">
          <Lock :size="14" />
          Ligação segura e monitorizada
        </div>
      </form>

      <footer class="login-footer">
        © {{ new Date().getFullYear() }}
        Serviço Penitenciário de Angola
      </footer>
    </section>
  </main>
</template>
