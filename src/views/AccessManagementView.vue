<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api, getApiErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { ShieldCheck, KeyRound, Users, Plus, Pencil, Trash2, Save, RefreshCw } from 'lucide-vue-next'

const auth = useAuthStore()
const isAdmin = computed(() => String(auth.userEmail || '').toLowerCase() === 'admin@sigclop.local')
const activeTab = ref('roles')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const roles = ref([])
const permissions = ref([])
const users = ref([])
const showRoleForm = ref(false)
const showPermissionForm = ref(false)
const editingRoleId = ref(null)
const editingPermissionId = ref(null)
const selectedUserId = ref('')
const userAccess = ref({ roles: [], permissions: [], effective_permissions: [], is_system_admin: false })
const roleForm = ref({ name: '', permissions: [] })
const permissionForm = ref({ name: '' })
const search = ref('')
const rolePage = ref(1)
const permissionPage = ref(1)
const accessPageSize = ref(10)
const pagedRoles = computed(() => filteredRoles.value.slice((rolePage.value - 1) * accessPageSize.value, rolePage.value * accessPageSize.value))
const pagedPermissions = computed(() => filteredPermissions.value.slice((permissionPage.value - 1) * accessPageSize.value, permissionPage.value * accessPageSize.value))
const rolePages = computed(() => Math.max(1, Math.ceil(filteredRoles.value.length / accessPageSize.value)))
const permissionPages = computed(() => Math.max(1, Math.ceil(filteredPermissions.value.length / accessPageSize.value)))

const filteredRoles = computed(() => roles.value.filter(r => r.name.toLowerCase().includes(search.value.toLowerCase())))
const filteredPermissions = computed(() => permissions.value.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase())))
const filteredUsers = computed(() => users.value.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(search.value.toLowerCase())))
watch(search, () => { rolePage.value = 1; permissionPage.value = 1 })

function listFrom(response) {
  const data = response?.data
  if (Array.isArray(data)) return data
  return data?.data || []
}

async function load() {
  if (!isAdmin.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/access-management')
    roles.value = data.roles || []
    permissions.value = data.permissions || []
    users.value = data.users || []
    if (!selectedUserId.value && users.value.length) {
      const first = users.value.find(u => !u.is_system_admin) || users.value[0]
      selectedUserId.value = String(first.id)
      await loadUserAccess()
    } else if (selectedUserId.value) {
      await loadUserAccess()
    }
  } catch (e) {
    error.value = getApiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function clearMessages() { error.value = ''; success.value = '' }
function openNewRole() {
  clearMessages(); editingRoleId.value = null
  roleForm.value = { name: '', permissions: [] }; showRoleForm.value = true
}
function openEditRole(role) {
  clearMessages(); editingRoleId.value = role.id
  roleForm.value = { name: role.name, permissions: (role.permissions || []).map(p => p.name) }
  showRoleForm.value = true
}
function openNewPermission() {
  clearMessages(); editingPermissionId.value = null
  permissionForm.value = { name: '' }; showPermissionForm.value = true
}
function openEditPermission(permission) {
  clearMessages(); editingPermissionId.value = permission.id
  permissionForm.value = { name: permission.name }; showPermissionForm.value = true
}

async function saveRole() {
  saving.value = true; clearMessages()
  try {
    if (editingRoleId.value) {
      await api.put(`/access-management/roles/${editingRoleId.value}`, roleForm.value)
      success.value = 'Perfil actualizado com sucesso.'
    } else {
      await api.post('/access-management/roles', roleForm.value)
      success.value = 'Perfil criado com sucesso.'
    }
    showRoleForm.value = false; await load()
  } catch (e) { error.value = getApiErrorMessage(e) }
  finally { saving.value = false }
}

async function deleteRole(role) {
  if (!window.confirm(`Tem a certeza de que pretende eliminar o perfil "${role.name}"?`)) return
  clearMessages()
  try { await api.delete(`/access-management/roles/${role.id}`); success.value = 'Perfil eliminado.'; await load() }
  catch (e) { error.value = getApiErrorMessage(e) }
}

async function savePermission() {
  saving.value = true; clearMessages()
  try {
    if (editingPermissionId.value) {
      await api.put(`/access-management/permissions/${editingPermissionId.value}`, permissionForm.value)
      success.value = 'Permissão actualizada com sucesso.'
    } else {
      await api.post('/access-management/permissions', permissionForm.value)
      success.value = 'Permissão criada com sucesso.'
    }
    showPermissionForm.value = false; await load()
  } catch (e) { error.value = getApiErrorMessage(e) }
  finally { saving.value = false }
}

async function deletePermission(permission) {
  if (!window.confirm(`Eliminar a permissão "${permission.name}"? Ela será removida dos perfis e acessos directos associados.`)) return
  clearMessages()
  try { await api.delete(`/access-management/permissions/${permission.id}`); success.value = 'Permissão eliminada.'; await load() }
  catch (e) { error.value = getApiErrorMessage(e) }
}

async function loadUserAccess() {
  if (!selectedUserId.value) return
  clearMessages()
  try {
    const { data } = await api.get(`/access-management/users/${selectedUserId.value}`)
    userAccess.value = { ...data, roles: data.roles || [], permissions: data.permissions || [], effective_permissions: data.effective_permissions || [] }
  } catch (e) { error.value = getApiErrorMessage(e) }
}

async function saveUserAccess() {
  if (userAccess.value.is_system_admin) {
    success.value = 'O administrador principal mantém todas as permissões do sistema.'
    return
  }
  saving.value = true; clearMessages()
  try {
    const { data } = await api.put(`/access-management/users/${selectedUserId.value}`, {
      roles: userAccess.value.roles,
      permissions: userAccess.value.permissions,
    })
    userAccess.value = { ...data.user, effective_permissions: data.user.effective_permissions || [] }
    success.value = data.message || 'Acessos actualizados.'
    await load()
  } catch (e) { error.value = getApiErrorMessage(e) }
  finally { saving.value = false }
}

function toggleValue(collection, value, checked) {
  const current = new Set(collection.value)
  checked ? current.add(value) : current.delete(value)
  collection.value = [...current]
}
function toggleRolePermission(permission, checked) { toggleValue({ get value() { return roleForm.value.permissions }, set value(v) { roleForm.value.permissions = v } }, permission, checked) }
function toggleUserRole(role, checked) { toggleValue({ get value() { return userAccess.value.roles }, set value(v) { userAccess.value.roles = v } }, role, checked) }
function toggleUserPermission(permission, checked) { toggleValue({ get value() { return userAccess.value.permissions }, set value(v) { userAccess.value.permissions = v } }, permission, checked) }
function hasRolePermission(role, permission) { return (role.permissions || []).some(p => p.name === permission) }
function hasUserPermission(permission) { return userAccess.value.permissions.includes(permission) }

onMounted(load)
</script>

<template>
  <section class="module-page access-management-page">
    <article v-if="isAdmin" class="module-card functional-card access-card">
      <header class="access-page-header">
        <div class="access-title-wrap">
          <span class="access-icon"><ShieldCheck :size="23" /></span>
          <div><h2>Gestão de Acessos</h2><p class="module-subtitle">Perfis, permissões e acessos individuais dos utilizadores.</p></div>
        </div>
        <button class="ghost-button" :disabled="loading" @click="load"><RefreshCw :size="15" /> Actualizar</button>
      </header>

      <div class="access-summary">
        <div><span>Perfis</span><strong>{{ roles.length }}</strong></div>
        <div><span>Permissões</span><strong>{{ permissions.length }}</strong></div>
        <div><span>Utilizadores</span><strong>{{ users.length }}</strong></div>
        <div><span>Administrador principal</span><strong class="access-admin-status">Protegido</strong></div>
      </div>

      <p v-if="error" class="form-error access-message">{{ error }}</p>
      <p v-if="success" class="success-message access-message">{{ success }}</p>

      <div class="access-toolbar">
        <div class="access-tabs">
          <button :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'; search = ''"><ShieldCheck :size="16" /> Perfis/Funções</button>
          <button :class="{ active: activeTab === 'permissions' }" @click="activeTab = 'permissions'; search = ''"><KeyRound :size="16" /> Permissões</button>
          <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'; search = ''"><Users :size="16" /> Acessos dos utilizadores</button>
        </div>
        <input v-model="search" class="access-search" placeholder="Pesquisar..." />
      </div>

      <template v-if="activeTab === 'roles'">
        <div class="access-section-heading"><div><h3>Perfis/Funções</h3><p>Associe conjuntos de permissões a cada função.</p></div><button class="primary-button" @click="openNewRole"><Plus :size="16" /> Novo perfil</button></div>
        <div class="access-table-wrap"><table class="access-table"><thead><tr><th>Nome do perfil</th><th>Permissões</th><th>Utilizadores</th><th>Acções</th></tr></thead><tbody>
          <tr v-for="role in pagedRoles" :key="role.id"><td><strong>{{ role.name }}</strong><span v-if="role.name === 'administrador'" class="access-tag">Sistema</span></td><td>{{ (role.permissions || []).length }} permissões</td><td>{{ role.users_count ?? 0 }}</td><td class="access-actions"><button class="table-action" @click="openEditRole(role)"><Pencil :size="14" /> Editar</button><button class="table-action danger-action" :disabled="role.name === 'administrador' || (role.users_count || 0) > 0" @click="deleteRole(role)"><Trash2 :size="14" /> Eliminar</button></td></tr>
          <tr v-if="!filteredRoles.length"><td colspan="4" class="access-empty">Nenhum perfil encontrado.</td></tr>
        </tbody></table></div>
        <div v-if="filteredRoles.length" class="pagination-bar"><span>{{ (rolePage - 1) * accessPageSize + 1 }}–{{ Math.min(rolePage * accessPageSize, filteredRoles.length) }} de {{ filteredRoles.length }} perfis</span><div class="pagination-controls"><label>Linhas <select v-model.number="accessPageSize" @change="rolePage = 1; permissionPage = 1"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label><button class="ghost-button" :disabled="rolePage <= 1" @click="rolePage--">Anterior</button><strong>{{ rolePage }} / {{ rolePages }}</strong><button class="ghost-button" :disabled="rolePage >= rolePages" @click="rolePage++">Seguinte</button></div></div>
      </template>

      <template v-else-if="activeTab === 'permissions'">
        <div class="access-section-heading"><div><h3>Permissões do sistema</h3><p>Permissões individuais usadas para proteger operações da API.</p></div><button class="primary-button" @click="openNewPermission"><Plus :size="16" /> Nova permissão</button></div>
        <div class="access-table-wrap"><table class="access-table"><thead><tr><th>Permissão</th><th>Área</th><th>Acções</th></tr></thead><tbody>
          <tr v-for="permission in pagedPermissions" :key="permission.id"><td><code>{{ permission.name }}</code></td><td>{{ permission.name.split('.')[0] }}</td><td class="access-actions"><button class="table-action" @click="openEditPermission(permission)"><Pencil :size="14" /> Editar</button><button class="table-action danger-action" @click="deletePermission(permission)"><Trash2 :size="14" /> Eliminar</button></td></tr>
          <tr v-if="!filteredPermissions.length"><td colspan="3" class="access-empty">Nenhuma permissão encontrada.</td></tr>
        </tbody></table></div>
        <div v-if="filteredPermissions.length" class="pagination-bar"><span>{{ (permissionPage - 1) * accessPageSize + 1 }}–{{ Math.min(permissionPage * accessPageSize, filteredPermissions.length) }} de {{ filteredPermissions.length }} permissões</span><div class="pagination-controls"><button class="ghost-button" :disabled="permissionPage <= 1" @click="permissionPage--">Anterior</button><strong>{{ permissionPage }} / {{ permissionPages }}</strong><button class="ghost-button" :disabled="permissionPage >= permissionPages" @click="permissionPage++">Seguinte</button></div></div>
      </template>

      <template v-else>
        <div class="access-section-heading"><div><h3>Atribuir acessos a utilizadores</h3><p>Combine perfis e permissões directas. As permissões efectivas são a soma de ambas.</p></div></div>
        <label class="access-user-select">Seleccionar utilizador<select v-model="selectedUserId" @change="loadUserAccess"><option value="">Seleccione um utilizador</option><option v-for="user in filteredUsers" :key="user.id" :value="String(user.id)">{{ user.name }} — {{ user.email }}</option></select></label>
        <div v-if="selectedUserId" class="user-access-editor">
          <div class="user-access-heading"><div><h4>{{ users.find(u => String(u.id) === String(selectedUserId))?.name }}</h4><p>{{ users.find(u => String(u.id) === String(selectedUserId))?.email }}</p></div><span v-if="userAccess.is_system_admin" class="access-tag">Administrador protegido</span></div>
          <p v-if="userAccess.is_system_admin" class="access-admin-note">Este utilizador tem sempre todas as permissões actuais e futuras. A sua protecção não pode ser removida nesta página.</p>
          <div class="access-check-grid">
            <section><h4>Perfis/Funções</h4><label v-for="role in roles" :key="role.id" class="access-check"><input type="checkbox" :checked="userAccess.roles.includes(role.name)" :disabled="userAccess.is_system_admin" @change="toggleUserRole(role.name, $event.target.checked)" /><span><strong>{{ role.name }}</strong><small>{{ (role.permissions || []).length }} permissões</small></span></label></section>
            <section><h4>Permissões directas</h4><label v-for="permission in permissions" :key="permission.id" class="access-check"><input type="checkbox" :checked="hasUserPermission(permission.name)" :disabled="userAccess.is_system_admin" @change="toggleUserPermission(permission.name, $event.target.checked)" /><span><strong>{{ permission.name }}</strong><small>{{ permission.name.split('.')[0] }}</small></span></label></section>
          </div>
          <div class="user-access-footer"><span>{{ userAccess.effective_permissions?.length || 0 }} permissões efectivas actuais</span><button class="primary-button" :disabled="saving || userAccess.is_system_admin" @click="saveUserAccess"><Save :size="16" /> {{ saving ? 'A guardar...' : 'Guardar acessos' }}</button></div>
        </div>
      </template>
    </article>

    <article v-else class="module-card functional-card access-denied"><ShieldCheck :size="38"/><h2>Acesso reservado</h2><p>A gestão de perfis e permissões está disponível exclusivamente para admin@sigclop.local.</p></article>

    <div v-if="showRoleForm" class="modal-backdrop" @click.self="showRoleForm = false">
      <section class="request-modal access-modal" role="dialog" aria-modal="true" aria-labelledby="role-form-title"><header class="request-modal-header"><div class="request-modal-heading-icon"><ShieldCheck :size="22" /></div><div class="request-modal-heading-copy"><h2 id="role-form-title">{{ editingRoleId ? 'Editar perfil' : 'Criar perfil/função' }}</h2><p>Defina o nome e as permissões associadas.</p></div><button class="modal-close-button" @click="showRoleForm = false">×</button></header>
        <form class="access-modal-body" @submit.prevent="saveRole"><label>Nome do perfil<input v-model.trim="roleForm.name" required pattern="[A-Za-z0-9_.-]+" maxlength="100" placeholder="ex.: gestor_armazem" :disabled="roleForm.name === 'administrador'" /><small>Use letras sem espaços, números, ponto, hífen ou underscore.</small></label><div class="access-permission-picker"><div class="access-picker-heading"><strong>Permissões</strong><span>{{ roleForm.permissions.length }} seleccionadas</span></div><label v-for="permission in permissions" :key="permission.id" class="access-check"><input type="checkbox" :checked="roleForm.permissions.includes(permission.name)" @change="toggleRolePermission(permission.name, $event.target.checked)" /><span><strong>{{ permission.name }}</strong><small>{{ permission.name.split('.')[0] }}</small></span></label></div><footer class="access-modal-footer"><button type="button" class="ghost-button" @click="showRoleForm = false">Cancelar</button><button type="submit" class="primary-button" :disabled="saving"><Save :size="16" /> {{ saving ? 'A guardar...' : 'Guardar perfil' }}</button></footer></form>
      </section>
    </div>

    <div v-if="showPermissionForm" class="modal-backdrop" @click.self="showPermissionForm = false">
      <section class="request-modal access-modal access-permission-modal" role="dialog" aria-modal="true" aria-labelledby="permission-form-title"><header class="request-modal-header"><div class="request-modal-heading-icon"><KeyRound :size="22" /></div><div class="request-modal-heading-copy"><h2 id="permission-form-title">{{ editingPermissionId ? 'Editar permissão' : 'Criar permissão' }}</h2><p>Use uma chave única, por exemplo, pedidos.exportar.</p></div><button class="modal-close-button" @click="showPermissionForm = false">×</button></header>
        <form class="access-modal-body" @submit.prevent="savePermission"><label>Nome da permissão<input v-model.trim="permissionForm.name" required pattern="[A-Za-z0-9_.-]+" maxlength="150" placeholder="ex.: pedidos.exportar" /><small>Convenção recomendada: modulo.acao</small></label><footer class="access-modal-footer"><button type="button" class="ghost-button" @click="showPermissionForm = false">Cancelar</button><button type="submit" class="primary-button" :disabled="saving"><Save :size="16" /> {{ saving ? 'A guardar...' : 'Guardar permissão' }}</button></footer></form>
      </section>
    </div>
  </section>
</template>
