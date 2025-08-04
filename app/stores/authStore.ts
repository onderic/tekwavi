import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | {
      id: string
      firstName: string
      lastName: string
      email: string
    },
  }),
  actions: {
    setUser(user: any) {
      this.user = user
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    clearUser() {
      this.user = null
      localStorage.removeItem('auth_user')
    },
    loadUser() {
      const userStr = localStorage.getItem('auth_user')
      if (userStr) {
        this.user = JSON.parse(userStr)
      }
    },
  },
})
