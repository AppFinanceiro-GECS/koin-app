import axios, { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL } from '@/lib/config'
import { isTokenExpired } from '@/lib/jwt'
import { useAuthStore } from '@/stores/authStore'
import type { Token } from '@/types/api'

const api = create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Rotas públicas: não recebem Authorization nem disparam refresh
const PUBLIC_ROUTES = ['/auth/login', '/auth/invite', '/auth/refresh', '/auth/reset-password']
const isPublicRoute = (url?: string) => !!url && PUBLIC_ROUTES.some((r) => url.includes(r))

// Um único refresh em andamento por vez; requisições concorrentes aguardam o mesmo promise
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, setTokens, signOut } = useAuthStore.getState()
      if (!refreshToken || isTokenExpired(refreshToken, 60)) {
        await signOut()
        throw new Error('Sessão expirada')
      }
      try {
        const { data } = await axios.post<Token>(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        await setTokens(data)
        return data.access_token
      } catch (error) {
        await signOut()
        throw error
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use(async (config) => {
  if (isPublicRoute(config.url)) return config

  let { accessToken } = useAuthStore.getState()
  if (!accessToken) return config

  if (isTokenExpired(accessToken, 30)) {
    accessToken = await refreshAccessToken()
  }
  config.headers.Authorization = `Bearer ${accessToken}`

  // Permite que o FormData gere o header multipart com boundary dinâmico
  const isFormData =
    config.data instanceof FormData ||
    (config.data && typeof (config.data as any).append === 'function')

  if (isFormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type')
    } else if (config.headers) {
      delete config.headers['Content-Type']
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !original || original._retry || isPublicRoute(original.url)) {
      return Promise.reject(error)
    }

    original._retry = true
    const token = await refreshAccessToken()
    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)

export default api
