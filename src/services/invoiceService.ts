import api from '@/services/api'
import type { InvoiceDetailResponse, InvoicePaymentRequest, InvoiceResponse } from '@/types/invoice'

export const invoiceService = {
  async getInvoice(invoiceId: number): Promise<InvoiceDetailResponse> {
    const response = await api.get(`/credit-cards/invoices/${invoiceId}`)
    return response.data as InvoiceDetailResponse
  },

  async listInvoices(
    creditCardId?: number,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<InvoiceResponse[]> {
    const params = new URLSearchParams()
    if (creditCardId) params.append('credit_card_id', String(creditCardId))
    if (status) params.append('status', status)
    params.append('limit', String(limit))
    params.append('offset', String(offset))

    const response = await api.get(`/credit-cards/invoices?${params}`)
    return response.data as InvoiceResponse[]
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
}
