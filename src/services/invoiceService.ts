import api from '@/services/api'
import type {
  InvoiceDetailResponse,
  InvoicePaymentRequest,
  InvoiceResponse,
  InvoiceDuplicateWarning,
} from '@/types/invoice'

const mockInvoices: InvoiceResponse[] = [
  {
    id: 1,
    credit_card_id: 1,
    credit_card_name: 'Nubank',
    period_display: 'Outubro',
    total_amount: 2380,
    remaining_amount: 0,
    paid_amount: 2380,
    status: 'paid',
    due_date: '2026-10-04',
    closing_date: '2026-09-24',
    transaction_count: 0,
  } as InvoiceResponse,
  {
    id: 2,
    credit_card_id: 1,
    credit_card_name: 'Nubank',
    period_display: 'Novembro',
    total_amount: 1495.9,
    remaining_amount: 1495.9,
    paid_amount: 0,
    status: 'open',
    due_date: '2026-11-04',
    closing_date: '2026-10-24',
    transaction_count: 0,
  } as InvoiceResponse,
  {
    id: 3,
    credit_card_id: 2,
    credit_card_name: 'Inter',
    period_display: 'Outubro',
    total_amount: 1150.4,
    remaining_amount: 1150.4,
    paid_amount: 0,
    status: 'partial',
    due_date: '2026-11-07',
    closing_date: '2026-10-28',
    transaction_count: 0,
  } as InvoiceResponse,
]

export const invoiceService = {
  async getInvoice(invoiceId: number): Promise<InvoiceDetailResponse> {
    try {
      const response = await api.get(`/credit-cards/invoices/${invoiceId}`)
      return response.data as InvoiceDetailResponse
    } catch (error) {
      const mock = mockInvoices.find((inv) => inv.id === invoiceId)
      if (mock) {
        return {
          ...mock,
          paid_at: mock.status === 'paid' ? '2026-10-03' : undefined,
        } as InvoiceDetailResponse
      }
      throw error
    }
  },

  async listInvoices(
    creditCardId?: number,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<InvoiceResponse[]> {
    try {
      const params = new URLSearchParams()
      if (creditCardId) params.append('credit_card_id', String(creditCardId))
      if (status) params.append('status', status)
      params.append('limit', String(limit))
      params.append('offset', String(offset))

      const response = await api.get(`/credit-cards/invoices?${params}`)
      return response.data as InvoiceResponse[]
    } catch (error) {
      let filtered = mockInvoices
      if (creditCardId) {
        filtered = filtered.filter((inv) => inv.credit_card_id === creditCardId)
      }
      if (status) {
        filtered = filtered.filter((inv) => inv.status === status)
      }
      return filtered.slice(offset, offset + limit)
    }
  },

  async payInvoice(invoiceId: number, data: InvoicePaymentRequest): Promise<InvoiceResponse> {
    const response = await api.post(`/credit-cards/invoices/${invoiceId}/pay`, data)
    return response.data as InvoiceResponse
  },

  async updateInvoice(invoiceId: number, data: Partial<InvoiceResponse>): Promise<InvoiceResponse> {
    const response = await api.patch(`/credit-cards/invoices/${invoiceId}`, data)
    return response.data as InvoiceResponse
  },

  async deleteInvoice(invoiceId: number, deleteTransactions = false): Promise<any> {
    const params = new URLSearchParams()
    params.append('delete_transactions', String(deleteTransactions))

    const response = await api.delete(`/credit-cards/invoices/${invoiceId}?${params}`)
    return response.data
  },

  async getDuplicateWarnings(invoiceId: number): Promise<InvoiceDuplicateWarning> {
    try {
      const response = await api.get(`/credit-cards/invoices/${invoiceId}/duplicate-warnings`)
      return response.data as InvoiceDuplicateWarning
    } catch (error) {
      return {
        has_duplicates: false,
        estimated_excess: 0,
        affected_series_pairs: [],
        duplicate_count: 0,
      }
    }
  },
}
