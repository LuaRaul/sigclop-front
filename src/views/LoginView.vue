<script setup>
import { Eye, Lock, User } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../components/layout/BrandMark.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('admin@sigclop.local')
const password = ref('password')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''

  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Nao foi possivel iniciar sessao.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-screen">
    <section class="login-hero">
      <BrandMark />
      <div class="login-title">
        <strong>SISTEMA INTEGRADO DE GESTAO</strong>
        <span>E CONTROLO LOGISTICO PRISIONAL</span>
      </div>

      <form class="login-card" @submit.prevent="submit">
        <h1>Iniciar Sessao</h1>
        <label>
          Utilizador
          <span class="input-wrap">
            <User :size="17" />
            <input v-model="email" type="email" autocomplete="username" placeholder="Digite o seu utilizador" />
          </span>
        </label>
        <label>
          Palavra-passe
          <span class="input-wrap">
            <Lock :size="17" />
            <input v-model="password" type="password" autocomplete="current-password" placeholder="Digite a sua palavra-passe" />
            <Eye :size="16" />
          </span>
        </label>
        <a href="#">Esqueceu a palavra-passe?</a>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button :disabled="loading">{{ loading ? 'A entrar...' : 'ENTRAR' }}</button>
        <small><Lock :size="13" /> Acesso exclusivo para utilizadores autorizados.</small>
      </form>
    </section>
  </main>
</template>
