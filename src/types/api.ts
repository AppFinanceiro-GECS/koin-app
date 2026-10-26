// Espelho dos schemas Pydantic do koin-api usados pelo app.
// Mudou um schema lá? Atualize aqui.

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  name: string
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  created_at: string
}

export interface InviteValidation {
  email: string
  license_type: string | null
  is_valid: boolean
}

export type AccountType = 'wallet' | 'bank' | 'credit_card' | 'investment' | 'benefit_card'

export interface Account {
  id: number
  name: string
  type: AccountType
  bank_id: string | null
  currency: string
  color: string | null
  icon: string | null
  balance: number
  is_active: boolean
  ownership_type: string
  created_at: string
}

export type TransactionType = 'expense' | 'income' | 'transfer'

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'bank_transfer'
  | 'boleto'
  | 'cash'
  | 'voucher'
  | (string & {})

export interface Transaction {
  id: number
  type: TransactionType
  payment_method: PaymentMethod | null
  amount: number | string
  currency: string
  date: string
  description: string | null
  notes: string | null
  tags: string[] | null
  is_fixed: boolean
  account_id: number
  category_id: number | null
  merchant_id: number | null
  credit_card_id: number | null
  invoice_id: number | null
  is_recurring: boolean
  is_paid: boolean
  installment_number: number | null
  installment_total: number | null
  ownership_type: string
  is_transfer_out: boolean
  is_transfer_in: boolean
  category_name: string | null
  account_name: string | null
  merchant_name: string | null
  credit_card_name: string | null
  created_at: string
  updated_at: string
}

export interface TransactionCreate {
  type: TransactionType
  amount: number | string
  date: string
  account_id: number
  category_id?: number | null
  description?: string
  payment_method?: PaymentMethod | null
  destination_account_id?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
  icon: string | null
  color: string | null
  parent_id: number | null
  is_system: boolean
  created_at: string
}

export interface CategorySummary {
  category_id: number | null
  category_name: string
  total: number
  count: number
  percentage: number
  average: number
  trend: number | null
}

export interface AnalyticsSummary {
  period_start: string
  period_end: string
  total_income: number
  total_expense: number
  balance: number
  margin: number
  fixed_expenses: number
  variable_expenses: number
  credit_card_expenses: number
  debit_cash_expenses: number
  pending_invoices: number
  pending_total: number
  available_balance: number
  categories: CategorySummary[]
  top_merchants: { merchant_id: number | null; merchant_name: string; total: number; count: number }[]
  previous_period_expense: number | null
  expense_variation: number | null
}

export interface InvoiceOverviewItem {
  credit_card_id: number
  credit_card_name: string
  reference_month: number
  reference_year: number
  closing_date: string
  due_date: string
  state: 'not_created' | 'created_no_document' | 'created_with_document' | 'paid' | 'future'
  is_pending: boolean
  is_phantom: boolean
  invoice_id: number | null
  document_id: number | null
  total_amount: number | null
  paid_amount: number | null
  status: string | null
}

export interface InvoiceOverview {
  reference_month: number
  reference_year: number
  items: InvoiceOverviewItem[]
  total_cards: number
  pending_count: number
}
