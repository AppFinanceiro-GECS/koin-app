import type { QueryClient } from '@tanstack/react-query'

import type { CreditCardLinkedData, CreditCardListItem } from '@/types/api'

/** Nome que o usuário reconhece: apelido ou nome, com o final quando houver */
export function creditCardLabel(card: Pick<CreditCardListItem, 'name' | 'nickname' | 'last_four_digits'>): string {
  const base = card.nickname?.trim() || card.name?.trim() || 'Cartão'
  return card.last_four_digits ? `${base} final ${card.last_four_digits}` : base
}

/** Cartões que podem receber lançamentos ou faturas (desativados ficam de fora) */
export function activeCreditCards<T extends { is_active: boolean }>(cards: T[] | undefined | null): T[] {
  return Array.isArray(cards) ? cards.filter((c) => c.is_active !== false) : []
}

/**
 * Tudo que muda quando um cartão é criado, editado ou excluído: a lista de cartões,
 * as contas (o cartão tem uma conta própria), faturas, lançamentos, parcelamentos e resumos.
 */
export async function invalidateCreditCardQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    ['credit-cards', 'credit-card', 'accounts', 'invoices', 'invoice', 'transactions', 'installments', 'analytics'].map(
      (key) => queryClient.invalidateQueries({ queryKey: [key] })
    )
  )
}

/** Lê o 409 do DELETE /credit-cards/{id} (cartão com lançamentos, faturas ou parcelamentos) */
export function linkedDataFromError(error: unknown): CreditCardLinkedData | null {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  const detail = response?.data?.detail as Partial<CreditCardLinkedData> | undefined
  if (response?.status === 409 && detail && detail.code === 'credit_card_has_linked_data') {
    return detail as CreditCardLinkedData
  }
  return null
}
