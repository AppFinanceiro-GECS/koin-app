import api from './api'
import type { InviteValidation, Token, User } from '../types/api'

// Cadastro aberto (/auth/register) está desativado no backend: novos usuários entram por convite.
export const authApi = {
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
  validateInvite: (token: string) => api.get<InviteValidation>(`/auth/invite/${token}`),
  registerWithInvite: (token: string, name: string, password: string) =>
    api.post<Token>(`/auth/invite/${token}`, { name, password }),
  // TODO: o koin-api ainda não expõe a autoexclusão; este é o contrato esperado (senha no corpo, 204 em sucesso).
  deleteAccount: (password: string) => api.delete('/users/me', { data: { password } }),
}
