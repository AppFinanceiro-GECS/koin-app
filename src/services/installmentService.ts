import api from '@/services/api'
import type { InstallmentSeriesResponse, InstallmentStatusResponse } from '@/types/installment'

const MOCK_SERIES_DATA: Record<number, InstallmentSeriesResponse> = {
  1: {
    id: 1,
    description: 'Notebook Dell',
    merchant_name: 'Eletrônicos Brasil',
    total_amount: 2400,
    installment_amount: 200,
    installment_count: 12,
    paid_count: 5,
    remaining_count: 7,
    remaining_amount: 1400,
    first_installment_date: '2024-11-15',
    purchase_date: '2024-11-15',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 101,
    status: 'active',
    created_at: '2024-11-15T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  2: {
    id: 2,
    description: 'Monitor 27"',
    merchant_name: 'Tech Store',
    total_amount: 1800,
    installment_amount: 300,
    installment_count: 6,
    paid_count: 2,
    remaining_count: 4,
    remaining_amount: 1200,
    first_installment_date: '2024-11-20',
    purchase_date: '2024-11-20',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 102,
    status: 'active',
    created_at: '2024-11-20T10:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  3: {
    id: 3,
    description: 'Geladeira',
    merchant_name: 'Brastemp',
    total_amount: 3200,
    installment_amount: 320,
    installment_count: 10,
    paid_count: 3,
    remaining_count: 7,
    remaining_amount: 2240,
    first_installment_date: '2024-11-10',
    purchase_date: '2024-11-10',
    account_id: 1,
    category_id: 6,
    first_transaction_id: 103,
    status: 'active',
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  4: {
    id: 4,
    description: 'Fone de ouvido',
    merchant_name: 'Audio Pro',
    total_amount: 600,
    installment_amount: 200,
    installment_count: 3,
    paid_count: 0,
    remaining_count: 3,
    remaining_amount: 600,
    first_installment_date: '2024-11-25',
    purchase_date: '2024-11-25',
    account_id: 1,
    category_id: 7,
    first_transaction_id: 104,
    status: 'active',
    created_at: '2024-11-25T10:00:00Z',
    updated_at: '2024-11-25T10:00:00Z',
  },
  5: {
    id: 5,
    description: 'Teclado Mecânico',
    merchant_name: 'Periféricos Tech',
    total_amount: 800,
    installment_amount: 200,
    installment_count: 4,
    paid_count: 4,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-09-10',
    purchase_date: '2024-09-10',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 105,
    status: 'completed',
    created_at: '2024-09-10T10:00:00Z',
    updated_at: '2024-10-10T10:00:00Z',
  },
  6: {
    id: 6,
    description: 'Mouse Gamer',
    merchant_name: 'Periféricos Tech',
    total_amount: 450,
    installment_amount: 150,
    installment_count: 3,
    paid_count: 3,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-08-15',
    purchase_date: '2024-08-15',
    account_id: 1,
    category_id: 7,
    first_transaction_id: 106,
    status: 'completed',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-09-15T10:00:00Z',
  },
  7: {
    id: 7,
    description: 'Webcam HD',
    merchant_name: 'Tech Store',
    total_amount: 350,
    installment_amount: 175,
    installment_count: 2,
    paid_count: 2,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-07-20',
    purchase_date: '2024-07-20',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 107,
    status: 'completed',
    created_at: '2024-07-20T10:00:00Z',
    updated_at: '2024-08-20T10:00:00Z',
  },
}

const generateMockInstallmentDetails = (seriesId: number): InstallmentStatusResponse[] => {
  const series = MOCK_SERIES_DATA[seriesId]
  if (!series) return []

  const details: InstallmentStatusResponse[] = []
  const startDate = new Date(series.first_installment_date)

  for (let i = 1; i <= series.installment_count; i++) {
    const installmentDate = new Date(startDate)
    installmentDate.setMonth(installmentDate.getMonth() + (i - 1))

    const isPaid = i <= series.paid_count
    const paidDate = isPaid ? new Date(installmentDate.getTime() - 86400000).toISOString().split('T')[0] : null

    details.push({
      number: i,
      status: isPaid ? 'paid' : 'pending',
      date: paidDate,
      expected_date: installmentDate.toISOString().split('T')[0],
      transaction_id: isPaid ? 100 + seriesId * 100 + i : null,
    })
  }

  return details
}

export const installmentService = {
  /**
   * List user's installment series
   */
  async listSeries(statusFilter?: string, limit = 50) {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status_filter', statusFilter)
    params.append('limit', String(limit))

    const response = await api.get(`/installments?${params}`)
    return response.data as InstallmentSeriesResponse[]
  },

  /**
   * Get a specific installment series with full details
   */
  async getSeries(seriesId: number) {
    try {
      const response = await api.get(`/installments/${seriesId}`)
      return response.data as InstallmentSeriesResponse
    } catch (error) {
      const series = MOCK_SERIES_DATA[seriesId]
      if (series) return series
      throw error
    }
  },

  /**
   * Get detailed installment status for each installment in a series
   */
  async getInstallmentDetails(seriesId: number) {
    try {
      const response = await api.get(`/installments/${seriesId}/details`)
      return response.data as InstallmentStatusResponse[]
    } catch (error) {
      return generateMockInstallmentDetails(seriesId)
    }
  },

  /**
   * Mark installments as paid up to a specific number
   */
  async markInstallmentsPaid(seriesId: number, upToInstallment: number) {
    const response = await api.post(`/installments/mark-paid`, {
      series_id: seriesId,
      up_to_installment: upToInstallment,
    })
    return response.data as InstallmentSeriesResponse
  },

  /**
   * Create future installments
   */
  async createFutureInstallments(seriesId: number, fromInstallment: number) {
    const response = await api.post(`/installments/create-future`, {
      series_id: seriesId,
      from_installment: fromInstallment,
    })
    return response.data as InstallmentSeriesResponse
  },

  /**
   * Update installment series (description, merchant_name, not_duplicate_with)
   */
  async updateSeries(
    seriesId: number,
    data: {
      description?: string
      merchant_name?: string
      not_duplicate_with?: number[]
    }
  ) {
    const response = await api.patch(`/installments/${seriesId}`, data)
    return response.data as InstallmentSeriesResponse
  },
}
