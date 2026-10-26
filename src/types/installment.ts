export type InstallmentSeriesStatus = 'active' | 'completed' | 'cancelled'

export interface InstallmentSeriesResponse {
  id: number
  description: string
  merchant_name: string
  total_amount: number
  installment_amount: number
  installment_count: number
  paid_count: number
  remaining_count: number
  remaining_amount: number
  first_installment_date: string
  purchase_date: string | null
  account_id: number
  category_id: number | null
  first_transaction_id: number | null
  status: InstallmentSeriesStatus
  created_at: string
  updated_at: string
  installments?: InstallmentStatusResponse[]
}

export interface InstallmentStatusResponse {
  number: number
  status: 'paid' | 'registered' | 'pending'
  date: string | null
  expected_date: string | null
  transaction_id: number | null
}
