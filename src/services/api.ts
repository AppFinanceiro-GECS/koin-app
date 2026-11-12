import axios, { create, isCancel, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL } from '@/lib/config'
import { isTokenExpired } from '@/lib/jwt'
import { useAuthStore } from '@/stores/authStore'
import type { Token } from '@/types/api'

const api = create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
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
  // Permite que o FormData gere o header multipart com boundary dinâmico no React Native e Web
  const isFormData =
    config.data instanceof FormData ||
    (config.data && typeof (config.data as any).append === 'function')

  if (isFormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', false)
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)['Content-Type']
      delete (config.headers as Record<string, unknown>)['content-type']
    }
    // Evita que transformRequest padrão do Axios tente serializar FormData como JSON
    config.transformRequest = (data) => data
  }

  if (isPublicRoute(config.url)) return config

  let { accessToken } = useAuthStore.getState()
  if (!accessToken) return config

  if (isTokenExpired(accessToken, 30)) {
    accessToken = await refreshAccessToken()
  }
  config.headers.Authorization = `Bearer ${accessToken}`

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

if (__DEV__) {
  api.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase() || 'GET'
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`
    console.log(`[API ➔] ${method} ${fullUrl}`)
    return config
  })

  api.interceptors.response.use(
    (response) => {
      const method = response.config.method?.toUpperCase() || 'GET'
      console.log(`[API ✓] ${response.status} ${method} ${response.config.url}`)
      return response
    },
    (error: AxiosError) => {
      if (isCancel(error)) {
        console.log(`[API ✋] Cancelado: ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
        return Promise.reject(error)
      }
      const status = error.response?.status ? `${error.response.status}` : 'NETWORK_ERROR'
      console.warn(`[API ✗] ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${error.message}`, {
        code: error.code,
        data: error.response?.data,
      })
      return Promise.reject(error)
    }
  )
}

export default api
