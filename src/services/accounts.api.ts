import api from './api'
import type { Account, CreditCardDetail, CreditCardListItem, CreditCardWrite } from '../types/api'

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts'),
  get: (id: number) => api.get(`/accounts/${id}`),
  create: (data: unknown) => api.post('/accounts', data),
  update: (id: number, data: unknown) => api.patch(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
}

export const creditCardsApi = {
  list: () => api.get<CreditCardListItem[]>('/credit-cards'),
  get: (id: number) => api.get<CreditCardDetail>(`/credit-cards/${id}`),
  create: (data: CreditCardWrite) => api.post<CreditCardDetail>('/credit-cards', data),
  update: (id: number, data: CreditCardWrite) =>
    api.patch<CreditCardDetail>(`/credit-cards/${id}`, data),
  // Cadastra o cartão com os dados da fatura lida; se um cartão já bate, devolve ele
  createFromDocument: (documentId: number) =>
    api.post<CreditCardDetail>(`/credit-cards/from-document/${documentId}`),
  // Sem force, cartão com lançamentos/faturas devolve 409 (CreditCardLinkedData)
  delete: (id: number, options?: { force?: boolean }) =>
    api.delete(`/credit-cards/${id}`, { params: options?.force ? { force: true } : {} }),
  recalculateInvoices: (id: number) => api.post(`/credit-cards/${id}/recalculate-invoices`),
  projectRecurring: (id: number, monthsAhead?: number) =>
    api.post(`/credit-cards/${id}/project-recurring`, null, {
      params: monthsAhead ? { months_ahead: monthsAhead } : {}
    }),
  // Invoice PDF password management
  saveInvoicePassword: (id: number, password: string) =>
    api.post(`/credit-cards/${id}/invoice-password`, { password }),
  deleteInvoicePassword: (id: number) =>
    api.delete(`/credit-cards/${id}/invoice-password`),
}

export const benefitCardsApi = {
  list: () => api.get('/benefit-cards'),
  get: (id: number) => api.get(`/benefit-cards/${id}`),
  create: (data: unknown) => api.post('/benefit-cards', data),
  update: (id: number, data: unknown) => api.patch(`/benefit-cards/${id}`, data),
  delete: (id: number) => api.delete(`/benefit-cards/${id}`),
  adjustBalance: (id: number, data: { adjustment_amount: number; reason: string }) =>
    api.post(`/benefit-cards/${id}/adjust-balance`, data),
}
