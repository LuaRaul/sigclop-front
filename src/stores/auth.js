import { defineStore } from 'pinia'
import { api } from '../services/api'

const TOKEN_KEY = 'sigclop_token'
const USER_KEY = 'sigclop_user'

function readStoredUser() {
    try {
        const user = localStorage.getItem(USER_KEY)

        return user ? JSON.parse(user) : null
    } catch {
        localStorage.removeItem(USER_KEY)
        return null
    }
}

function normalizeUser(user) {
    if (!user || typeof user !== 'object') {
        return null
    }

    const roles = Array.isArray(user.roles) ?
        user.roles :
        user.role ? [user.role] : []

    const permissions = Array.isArray(user.permissions) ?
        user.permissions : []

    const rolePermissions = roles.flatMap((role) => {
        if (!role || typeof role !== 'object') {
            return []
        }

        return Array.isArray(role.permissions) ?
            role.permissions : []
    })

    const permissionNames = [
        ...permissions,
        ...rolePermissions,
    ]
        .map((permission) => {
            if (typeof permission === 'string') {
                return permission
            }

            return permission?.name || null
        }).filter(Boolean)

    return {
        ...user,

        roles,

        permissions: [
            ...new Set(permissionNames),
        ],
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY),
        user: normalizeUser(readStoredUser()),
        loading: false,
    }),

    getters: {
        /*
        |--------------------------------------------------------------------------
        | Estado da autenticação
        |--------------------------------------------------------------------------
        */

        isAuthenticated: (state) => {
            return Boolean(state.token && state.user)
        },

        /*
        |--------------------------------------------------------------------------
        | Nome do utilizador
        |--------------------------------------------------------------------------
        */

        userName: (state) => {
            return state.user?.name || ''
        },

        /*
        |--------------------------------------------------------------------------
        | Email
        |--------------------------------------------------------------------------
        */

        userEmail: (state) => {
            return state.user?.email || ''
        },

        /*
        |--------------------------------------------------------------------------
        | Departamento
        |--------------------------------------------------------------------------
        */

        department: (state) => {
            return state.user?.department || null
        },

        departmentName: (state) => {
            return state.user?.department?.name || ''
        },

        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */

        roles: (state) => {
            if (!Array.isArray(state.user?.roles)) {
                return []
            }

            return state.user.roles.map((role) => {
                if (typeof role === 'string') {
                    return role
                }

                return role?.name
            }).filter(Boolean)
        },

        roleNames: (state) => {
            if (!Array.isArray(state.user?.roles)) {
                return []
            }

            return state.user.roles
                .map((role) => {
                    if (typeof role === 'string') {
                        return role
                    }

                    return role?.name
                })
                .filter(Boolean)
        },

        primaryRole: (state) => {
            const roles = state.user?.roles

            if (!Array.isArray(roles) || roles.length === 0) {
                return null
            }

            const role = roles[0]

            return typeof role === 'string' ?
                role :
                role?.name || null
        },

        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        permissions: (state) => {
            return Array.isArray(state.user?.permissions) ?
                state.user.permissions : []
        },

        /*
        |--------------------------------------------------------------------------
        | Labels
        |--------------------------------------------------------------------------
        */

        roleLabel: (state) => {
            const role = state.user?.roles?.[0]

            const roleName = typeof role === 'string' ?
                role :
                role?.name

            if (!roleName) {
                return 'Utilizador'
            }

            const labels = {
                director_geral: 'Director Geral',
                director: 'Director',
                funcionario: 'Funcionário',
                funcionario_armazem: 'Funcionário de Armazém',
            }

            return labels[roleName] || roleName
        },
    },

    actions: {
        /*
        |--------------------------------------------------------------------------
        | Login
        |--------------------------------------------------------------------------
        */

        async login(email, password) {
            this.loading = true

            try {
                const { data } = await api.post('/login', {
                    email,
                    password,
                })

                if (!data?.token) {
                    throw new Error('Token de autenticação não recebido.')
                }

                this.token = data.token
                this.user = normalizeUser({
                    ...(data.user || {}),
                    roles: data.roles || data.user?.roles || [],
                    permissions: data.permissions || data.user?.permissions || [],
                })
                localStorage.setItem(TOKEN_KEY, data.token)
                localStorage.setItem(
                    USER_KEY,
                    JSON.stringify(this.user)
                )

                return data
            } finally {
                this.loading = false
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Actualizar utilizador
        |--------------------------------------------------------------------------
        */

        setUser(user) {
            this.user = normalizeUser(user)

            if (this.user) {
                localStorage.setItem(
                    USER_KEY,
                    JSON.stringify(this.user)
                )
            } else {
                localStorage.removeItem(USER_KEY)
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Actualizar sessão
        |--------------------------------------------------------------------------
        */

        setToken(token) {
            this.token = token || null

            if (this.token) {
                localStorage.setItem(TOKEN_KEY, this.token)
            } else {
                localStorage.removeItem(TOKEN_KEY)
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Sincronizar sessão com /me
        |--------------------------------------------------------------------------
        */

        async fetchUser() {
            if (!this.token) {
                return null
            }

            try {
                const { data } = await api.get('/me')

                const user = {
                    ...(data?.user || data),
                    roles: data?.roles || data?.user?.roles || [],
                    permissions: data?.permissions || data?.user?.permissions || [],
                }

                this.setUser(user)

                return this.user
            } catch (error) {
                if (error?.response?.status === 401) {
                    this.clearSession()
                }

                throw error
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar Role
        |--------------------------------------------------------------------------
        */

        hasRole(role) {
            if (!role) {
                return false
            }

            return this.roleNames.includes(role)
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar vários Roles
        |--------------------------------------------------------------------------
        */

        hasAnyRole(roles = []) {
            if (!Array.isArray(roles)) {
                roles = [roles]
            }

            return roles.some((role) => this.hasRole(role))
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar todas as Roles
        |--------------------------------------------------------------------------
        */

        hasAllRoles(roles = []) {
            if (!Array.isArray(roles)) {
                roles = [roles]
            }

            return roles.every((role) => this.hasRole(role))
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar Permission
        |--------------------------------------------------------------------------
        */

        can(permission) {
            if (!permission) {
                return false
            }

            return this.permissions.includes(permission)
        },

        /*
        |--------------------------------------------------------------------------
        | Alias para can()
        |--------------------------------------------------------------------------
        */

        hasPermission(permission) {
            return this.can(permission)
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar qualquer Permission
        |--------------------------------------------------------------------------
        */

        hasAnyPermission(permissions = []) {
            if (!Array.isArray(permissions)) {
                permissions = [permissions]
            }

            return permissions.some((permission) => {
                return this.can(permission)
            })
        },

        /*
        |--------------------------------------------------------------------------
        | Verificar todas as Permissions
        |--------------------------------------------------------------------------
        */

        hasAllPermissions(permissions = []) {
            if (!Array.isArray(permissions)) {
                permissions = [permissions]
            }

            return permissions.every((permission) => {
                return this.can(permission)
            })
        },

        /*
        |--------------------------------------------------------------------------
        | Limpar sessão
        |--------------------------------------------------------------------------
        */

        clearSession() {
            this.token = null
            this.user = null
            this.loading = false

            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
        },

        /*
        |--------------------------------------------------------------------------
        | Logout
        |--------------------------------------------------------------------------
        */

        async logout() {
            try {
                if (this.token) {
                    await api.post('/logout')
                }
            } catch (error) {
                /*
                | Mesmo que o backend rejeite o logout,
                | a sessão local deve ser encerrada.
                */
            } finally {
                this.clearSession()
            }
        },
    },
})