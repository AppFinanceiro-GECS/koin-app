export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'partial' | 'overdue'

export interface InvoiceResponse {
  id: number
  user_id: number
  credit_card_id: number
  document_id: number | null
  reference_month: number
  reference_year: number
  closing_date: string
  due_date: string
  total_amount: number
  minimum_payment: number | null
  paid_amount: number
  remaining_amount: number
  status: InvoiceStatus
  paid_at: string | null
  payment_account_id: number | null
  payment_transaction_id: number | null
  notes: string | null
  created_at: string
  updated_at: string
  credit_card_name: string | null
  payment_account_name: string | null
  period_display: string
  transaction_count: number
}

export interface InvoiceDetailResponse extends InvoiceResponse {
  transactions: InvoiceTransactionResponse[]
}

export interface InvoiceTransactionResponse {
  id: number
  date: string
  description: string
  merchant_name: string | null
  category_name: string | null
  amount: number
  installment_number: number | null
  installment_total: number | null
  is_paid: boolean
}

export interface InvoicePaymentRequest {
  amount: number
  payment_account_id: number
  payment_date: string
  payment_method?: string
}
