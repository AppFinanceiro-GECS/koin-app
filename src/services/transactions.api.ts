import api from './api'
import type { Category, Paginated, Transaction, TransactionCreate } from '../types/api'

export const transactionsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Transaction>>('/transactions', { params }),
  getById: (id: number) => api.get<Transaction>(`/transactions/${id}`),
  create: (data: TransactionCreate) => api.post<Transaction>('/transactions', data),
  confirm: (data: unknown) => api.post('/transactions/confirm', data),
  batchConfirm: (data: {
    items: unknown[]
    card_closing_day?: number
    card_due_day?: number
  }) => api.post('/transactions/batch-confirm', data),
  update: (id: number, data: unknown) => api.patch(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
  checkProjected: (data: {
    items: {
      index: number
      description: string
      amount: number
      date?: string
      is_installment?: boolean
      installment_current?: number
      installment_total?: number
    }[]
    credit_card_id?: number
    invoice_month?: number
    invoice_year?: number
  }) => api.post('/transactions/check-projected', data),
  // No app o CSV vem como texto; salvar/compartilhar fica com expo-file-system + expo-sharing
  exportCSV: (params?: Record<string, unknown>) =>
    api.get<string>('/transactions/export/csv', { params, responseType: 'text' }),
}

export const installmentsApi = {
  list: (params?: { status_filter?: string; limit?: number }) =>
    api.get('/installments', { params }),
  getById: (id: number) => api.get(`/installments/${id}`),
  detectDuplicates: (minSimilarity = 0.7) =>
    api.post('/installments/detect-duplicates', { min_similarity: minSimilarity }),
  merge: (data: {
    source_series_id: number
    target_series_id: number
    conflict_resolution?: string
    new_merchant_name?: string
  }) => api.post('/installments/merge', data),
  update: (id: number, data: {
    description?: string
    merchant_name?: string
    not_duplicate_with?: number[]
  }) => api.patch(`/installments/${id}`, data),
  getDuplicateWarnings: (invoiceId: number) =>
    api.get(`/invoices/${invoiceId}/duplicate-warnings`),
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
}
