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

// GET /credit-cards (CreditCardListResponse)
export interface CreditCardListItem {
  id: number
  account_id: number
  name: string
  nickname: string | null
  bank_id: string | null
  credit_limit: number
  current_balance: number
  available_limit: number
  closing_day: number
  due_day: number
  has_points: boolean
  points_program: string | null
  points_factor: number | null
  card_brand: string | null
  card_variant: string | null
  last_four_digits: string | null
  annual_fee: number | null
  annual_fee_frequency: string
  annual_fee_waived: boolean
  color: string | null
  icon: string | null
  is_active: boolean
  has_invoice_password?: boolean
  ownership_type?: string
  user_id?: number | null
}

// GET /credit-cards/{id} (CreditCardResponse)
export interface CreditCardDetail {
  id: number
  account_id: number
  user_id: number
  credit_limit: number
  closing_day: number
  due_day: number
  has_points: boolean
  points_program: string | null
  nickname: string | null
  bank_id: string | null
  card_brand: string | null
  card_variant: string | null
  last_four_digits: string | null
  annual_fee: number | null
  annual_fee_frequency: string
  annual_fee_waived: boolean
  is_active: boolean
  has_invoice_password: boolean
  account_name: string | null
  account_balance: number
  account_color: string | null
  ownership_type?: string
}

export interface CreditCardWrite {
  name?: string
  nickname?: string | null
  credit_limit?: number
  closing_day?: number
  due_day?: number
  last_four_digits?: string | null
  card_brand?: string | null
  is_active?: boolean
  ownership_type?: 'personal' | 'household'
}

// 409 do DELETE /credit-cards/{id} sem force
export interface CreditCardLinkedData {
  code: 'credit_card_has_linked_data'
  message: string
  transactions: number
  invoices: number
  installments: number
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
  /** quem lançou (na família, quem pagou a despesa da casa) */
  user_id?: number | null
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
  destination_account_id?: number
  credit_card_id?: number | null
  category_id?: number | null
  description?: string
  payment_method?: PaymentMethod | null
  merchant_name?: string | null
  notes?: string | null
  tags?: string[] | null
  ownership_type?: 'personal' | 'household' | 'family' | string
  is_fixed?: boolean
  is_installment?: boolean
  installment_current?: number | null
  installment_total?: number | null
  create_future_installments?: boolean
  invoice_month?: number | null
  invoice_year?: number | null
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

export interface HouseholdMember {
  id: number
  license_id: number
  user_id: number
  user_name: string | null
  user_email: string | null
  role: 'owner' | 'member' | string
  nickname: string | null
  joined_at: string
  invited_by_id: number | null
  can_create_transactions: boolean
  can_edit_shared: boolean
  can_invite_members: boolean
  can_see_all: boolean
  /** parte nas despesas da casa (%); null = divisão igual */
  share_percent?: number | null
}

/** koin-api: GET /family/split — quem pagou o quê e quem deve a quem no mês */
export interface FamilySplitMember {
  member_id: number
  user_id: number
  name: string
  is_me: boolean
  share_percent: number
  paid: number
  expenses_count: number
  fair_share: number
  settled_out: number
  settled_in: number
  /** > 0 tem a receber; < 0 tem a pagar */
  balance: number
}

export interface FamilyTransfer {
  from_user_id: number
  from_name: string
  to_user_id: number
  to_name: string
  amount: number
}

export interface FamilySettlement {
  id: number
  from_user_id: number
  to_user_id: number
  amount: number
  note: string | null
  created_at: string
}

export interface FamilySplit {
  year: number
  month: number
  total: number
  split_mode: 'equal' | 'custom'
  is_settled: boolean
  members: FamilySplitMember[]
  transfers: FamilyTransfer[]
  categories: { name: string; amount: number }[]
  settlements: FamilySettlement[]
}

export interface FamilyContext {
  license_id: number
  license_type: string
  is_owner: boolean
  can_invite: boolean
  member_count: number
  max_members: number
  members: HouseholdMember[]
}

export interface FamilyInviteResponse {
  invitation_id: number
  email: string
  status: string
  expires_at: string
  code?: string
  token?: string
  invite_url?: string
}

export type DocumentStage =
  | 'received'
  | 'extracting'
  | 'validating'
  | 'done'
  | 'waiting'
  | 'failed'

export type DocumentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'duplicate'
  | 'waiting_ai'

export interface ExtractedItem {
  description: string
  amount: number
  date?: string | null
  category?: string | null
  confidence?: number
  transaction_type?: string | null
  is_installment?: boolean
  installment_current?: number | null
  installment_total?: number | null
  is_duplicate?: boolean
  existing_transaction_id?: number | null
  quantity?: number | null
  unit?: string | null
  unit_price?: number | null
  grocery_category?: string | null
}

export interface CardInfo {
  card_issuer?: string | null
  card_bank?: string | null
  card_brand?: string | null
  card_partner?: string | null
  card_last_digits?: string | null
  card_name?: string | null
  invoice_month?: number | null
  invoice_year?: number | null
  closing_date?: string | null
  closing_day?: number | null
  due_date?: string | null
  due_day?: number | null
  total_amount?: number | null
  credit_limit?: number | null
  credit_used?: number | null
  credit_available?: number | null
}

export interface PaymentInfo {
  total?: number | null
  subtotal?: number | null
  discount?: number | null
  store_name?: string | null
  store_cnpj?: string | null
  payments?: { method: string; amount: number; label: string; sequence: number }[]
}

export interface DocumentResponse {
  id: number
  file_hash: string
  original_filename: string
  mime_type: string
  status: DocumentStatus
  document_type: 'fatura_cartao' | 'cupom_fiscal' | 'extrato' | string | null
  error_message: string | null
  error_code?: string | null
  next_retry_at?: string | null
  stage?: DocumentStage | null
  created_at: string
  processed_at: string | null
  extracted_items: ExtractedItem[]
  is_duplicate: boolean
  card_info?: CardInfo | null
  card_match?: CardMatch | null
  /** Comprovantes: cartão da compra ou da fatura paga */
  payment_card?: PaymentCard | null
  /** Comprovante de pagamento de fatura: qual fatura em aberto ele quita */
  invoice_payment?: InvoicePaymentMatch | null
  payment_info?: PaymentInfo | null
}

/** Cartão citado num comprovante (final, bandeira, banco) */
export interface PaymentCard {
  card_issuer: string | null
  card_bank: string | null
  card_brand: string | null
  card_last_digits: string | null
}

/** Fatura que um comprovante de pagamento pode quitar */
export interface InvoicePaymentCandidate {
  invoice_id: number
  credit_card_id: number
  credit_card_name: string
  reference_month: number
  reference_year: number
  due_date: string
  total_amount: number
  remaining_amount: number
}

/** koin-api: GET /documents/{id} para comprovante_fatura */
export interface InvoicePaymentMatch {
  status: 'matched' | 'ambiguous' | 'already_paid' | 'none'
  amount_paid: number | null
  payment_date: string | null
  invoice: InvoicePaymentCandidate | null
  amount_matches: boolean
  candidates: InvoicePaymentCandidate[]
}

/** Cartão que a fatura descreve, para cadastrar com um toque */
export interface CardSuggestion {
  name: string
  last_four_digits: string | null
  bank_id: string | null
  card_brand: string | null
  closing_day: number | null
  due_day: number | null
  credit_limit: number | null
}

/** De qual cartão é o documento (koin-api: GET /documents/{id}) */
export interface CardMatch {
  /** unregistered: comprovante com o final de um cartão não cadastrado (o app pergunta) */
  status: 'matched' | 'new' | 'ambiguous' | 'unregistered' | 'none'
  credit_card_id: number | null
  credit_card_name: string | null
  candidate_ids: number[]
  suggestion: CardSuggestion | null
}

/** GET /invoices/outlook: parcelas já compradas por mês de fatura */
export interface InvoiceOutlook {
  scope: 'me' | 'family'
  months: { year: number; month: number; total: number; installments_count: number }[]
  total: number
}

export interface DocumentAsyncUploadResponse {
  id: number
  status: DocumentStatus
  message: string
  stage: DocumentStage
}

export interface DocumentSummary {
  id: number
  original_filename: string
  mime_type: string
  status: string
  document_type: string | null
  created_at: string
  processed_at: string | null
}

export interface DeviceRegister {
  expo_push_token: string
  platform: 'ios' | 'android' | 'web'
  app_version?: string
}

export interface DeviceResponse {
  id: number
  expo_push_token: string
  platform: string
  app_version: string | null
  last_used_at: string
}
