<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import Sidebar from './components/layout/Sidebar.vue'
import TopBar from './components/layout/TopBar.vue'

const route = useRoute()

/*
|--------------------------------------------------------------------------
| Estado do layout
|--------------------------------------------------------------------------
*/

const sidebarOpen = ref(false)

/*
|--------------------------------------------------------------------------
| Rotas públicas
|--------------------------------------------------------------------------
*/

const isLogin = computed(() => {
  return route.name === 'login'
})

/*
|--------------------------------------------------------------------------
| Sidebar
|--------------------------------------------------------------------------
*/

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

/*
|--------------------------------------------------------------------------
| Fechar Sidebar ao navegar
|--------------------------------------------------------------------------
*/

watch(
  () => route.fullPath,
  () => {
    closeSidebar()
  }
)

/*
|--------------------------------------------------------------------------
| Bloquear scroll quando o Sidebar mobile está aberto
|--------------------------------------------------------------------------
*/

watch(
  sidebarOpen,
  (open) => {
    if (isLogin.value) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = open ? 'hidden' : ''
  }
)

/*
|--------------------------------------------------------------------------
| Quando entrar no Login
|--------------------------------------------------------------------------
*/

watch(
  isLogin,
  (login) => {
    if (login) {
      closeSidebar()
      document.body.style.overflow = ''
    }
  }
)

/*
|--------------------------------------------------------------------------
| Limpeza
|--------------------------------------------------------------------------
*/

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>

  <!-- ================================================================
       ROTAS PÚBLICAS
       ================================================================ -->

  <RouterView
    v-if="isLogin"
    v-slot="{ Component }"
  >
    <Transition
      name="page-fade"
      mode="out-in"
    >
      <component
        :is="Component"
        :key="route.fullPath"
      />
    </Transition>
  </RouterView>


  <!-- ================================================================
       APLICAÇÃO AUTENTICADA
       ================================================================ -->

  <div
    v-else
    class="app-shell"
  >

    <!-- ============================================================
         TOPBAR
         ============================================================ -->

    <TopBar
      @toggle-sidebar="toggleSidebar"
    />


    <!-- ============================================================
         OVERLAY MOBILE
         ============================================================ -->

    <Transition name="sidebar-overlay">
      <button
        v-if="sidebarOpen"
        type="button"
        class="sidebar-overlay"
        aria-label="Fechar menu"
        @click="closeSidebar"
      />
    </Transition>


    <!-- ============================================================
         SIDEBAR
         ============================================================ -->

    <Sidebar
      :class="{
        'sidebar-mobile-open': sidebarOpen
      }"
    />


    <!-- ============================================================
         CONTEÚDO
         ============================================================ -->

    <main class="content">

      <RouterView
        v-slot="{ Component }"
      >
        <Transition
          name="page-fade"
          mode="out-in"
        >
          <component
            :is="Component"
            :key="route.fullPath"
          />
        </Transition>
      </RouterView>

    </main>


    <!-- ============================================================
         FOOTER
         ============================================================ -->

    <footer class="app-footer">

      <span>
        SIGCLOP - Sistema Integrado de Gestão e Controlo Logístico Prisional
      </span>

      <span>
        © {{ new Date().getFullYear() }} Todos os direitos reservados.
      </span>

      <span>
        Versão 1.0.0
      </span>

    </footer>

  </div>
</template>

<style scoped>

/*
|--------------------------------------------------------------------------
| TRANSIÇÃO DE PÁGINAS
|--------------------------------------------------------------------------
*/

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}


/*
|--------------------------------------------------------------------------
| OVERLAY
|--------------------------------------------------------------------------
*/

.sidebar-overlay {
  position: fixed;
  inset: 0;

  z-index: 90;

  width: 100%;
  height: 100%;

  padding: 0;
  margin: 0;

  border: 0;
  outline: none;

  background: rgba(0, 0, 0, 0.45);

  cursor: pointer;
}


/*
|--------------------------------------------------------------------------
| ANIMAÇÃO OVERLAY
|--------------------------------------------------------------------------
*/

.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}


/*
|--------------------------------------------------------------------------
| DESKTOP
|--------------------------------------------------------------------------
*/

@media (min-width: 981px) {

  .sidebar-overlay {
    display: none;
  }

}


/*
|--------------------------------------------------------------------------
| TABLET / MOBILE
|--------------------------------------------------------------------------
*/

@media (max-width: 980px) {

  /*
  | Mantemos o grid principal do projecto,
  | mas transformamos o Sidebar num drawer.
  */

  .app-shell {
    display: grid;

    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 72px minmax(0, 1fr) 38px;

    min-height: 100vh;
  }


  /*
  | TopBar ocupa toda a largura
  */

  :deep(.topbar) {
    grid-column: 1;
    grid-row: 1;

    width: 100%;
  }


  /*
  | Sidebar como drawer
  */

  :deep(.sidebar) {
    position: fixed;

    top: 0;
    left: 0;
    bottom: 0;

    z-index: 100;

    width: 280px;
    max-width: 86vw;

    display: flex !important;
    flex-direction: column !important;

    padding: 18px 12px;

    overflow-x: hidden;
    overflow-y: auto;

    transform: translateX(-105%);

    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    box-shadow: none;
  }


  /*
  | Sidebar aberto
  */

  :deep(.sidebar.sidebar-mobile-open) {
    transform: translateX(0);

    box-shadow:
      8px 0 30px rgba(0, 0, 0, 0.22);
  }


  /*
  | Navegação vertical dentro do drawer
  */

  :deep(.side-nav) {
    display: grid !important;

    grid-auto-flow: row !important;
    grid-auto-columns: auto !important;

    gap: 7px;

    overflow: visible;
  }


  :deep(.side-nav a) {
    width: 100%;
    min-height: 44px;
  }


  /*
  | Utilizador no final do Sidebar
  */

  :deep(.side-user) {
    display: flex !important;

    margin-top: auto;
  }


  /*
  | Conteúdo
  */

  .content {
    grid-column: 1;
    grid-row: 2;

    min-width: 0;
    width: 100%;

    padding: 20px 16px 24px;

    overflow-x: hidden;
  }


  /*
  | Footer
  */

  .app-footer {
    grid-column: 1;
    grid-row: 3;

    min-width: 0;

    display: flex;

    align-items: center;
    justify-content: center;

    gap: 12px;

    padding: 8px 16px;

    overflow: hidden;

    text-align: center;
  }


  .app-footer span:first-child,
  .app-footer span:last-child {
    display: none;
  }

}


/*
|--------------------------------------------------------------------------
| MOBILE
|--------------------------------------------------------------------------
*/

@media (max-width: 600px) {

  .app-shell {
    grid-template-rows: 64px minmax(0, 1fr) 34px;
  }


  .content {
    padding: 16px 12px 20px;
  }


  .app-footer {
    padding: 7px 12px;

    font-size: 10px;
  }


  :deep(.sidebar) {
    width: 270px;
  }

}


/*
|--------------------------------------------------------------------------
| MOBILE PEQUENO
|--------------------------------------------------------------------------
*/

@media (max-width: 380px) {

  :deep(.sidebar) {
    width: 250px;
  }

  .content {
    padding-left: 10px;
    padding-right: 10px;
  }

}

</style>