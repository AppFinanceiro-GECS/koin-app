import api from '@/services/api'
import type { InstallmentSeriesResponse, InstallmentStatusResponse } from '@/types/installment'

export const generateInstallmentDetails = (series: InstallmentSeriesResponse): InstallmentStatusResponse[] => {
  const details: InstallmentStatusResponse[] = []
  const startDate = new Date(series.first_installment_date || series.created_at)

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
      transaction_id: isPaid ? (series.first_transaction_id ?? null) : null,
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
    return (response.data || []) as InstallmentSeriesResponse[]
  },

  /**
   * Get a specific installment series with full details
   */
  async getSeries(seriesId: number) {
    const response = await api.get(`/installments/${seriesId}`)
    return response.data as InstallmentSeriesResponse
  },

  /**
   * Get detailed installment status for each installment in a series
   */
  async getInstallmentDetails(seriesId: number) {
    try {
      const response = await api.get(`/installments/${seriesId}/details`)
      return response.data as InstallmentStatusResponse[]
    } catch {
      try {
        const series = await this.getSeries(seriesId)
        return generateInstallmentDetails(series)
      } catch {
        return []
      }
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
