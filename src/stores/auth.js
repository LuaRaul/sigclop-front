import { defineStore } from 'pinia'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('sigclop_token'),
    user: JSON.parse(localStorage.getItem('sigclop_user') || 'null'),
  }),
  actions: {
    async login(email, password) {
      const { data } = await api.post('/login', { email, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('sigclop_token', data.token)
      localStorage.setItem('sigclop_user', JSON.stringify(data.user))
    },
    async logout() {
      if (this.token) {
        await api.post('/logout')
      }

      this.token = null
      this.user = null
      localStorage.removeItem('sigclop_token')
      localStorage.removeItem('sigclop_user')
    },
  },
})
