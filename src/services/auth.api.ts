import api from './api'
import type { DeviceRegister, DeviceResponse, InviteValidation, Token, User } from '../types/api'

// Cadastro aberto (/auth/register) está desativado no backend: novos usuários entram por convite.
export const authApi = {
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
  validateInvite: (token: string) => api.get<InviteValidation>(`/auth/invite/${token}`),
  registerWithInvite: (token: string, name: string, password: string) =>
    api.post<Token>(`/auth/invite/${token}`, { name, password }),
  exportData: () => api.get<Record<string, unknown>>('/users/me/export'),
  deleteAccount: (password: string) =>
    api.delete('/users/me', { data: { current_password: password } }),
  registerDevice: (data: DeviceRegister) =>
    api.post<DeviceResponse>('/users/me/devices', data),
  listDevices: () =>
    api.get<DeviceResponse[]>('/users/me/devices'),
  deleteDevice: (expoPushToken: string) =>
    api.delete(`/users/me/devices/${encodeURIComponent(expoPushToken)}`),
}
