import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { invalidateCreditCardQueries } from '@/lib/creditCards'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate, monthLabel } from '@/lib/format'
import { invoicesApi } from '@/services/documents.api'
import { darkTheme } from '@/theme/colors'
import type { InvoicePaymentCandidate, InvoicePaymentMatch } from '@/types/api'

interface PlainAccount {
  id: number
  name: string
}

export interface InvoicePaidResult {
  cardName: string
  month: number
  year: number
  amount: number
  fullyPaid: boolean
}

interface Props {
  payment: InvoicePaymentMatch
  /** Contas que podem pagar fatura (não cartão) */
  accounts: PlainAccount[]
  onPaid: (result: InvoicePaidResult) => void
  /** Lança o comprovante como despesa comum, sem ligar a fatura */
  onAsExpense: () => void
  onSendInvoice: () => void
}

const invoiceLabel = (inv: InvoicePaymentCandidate) =>
  `${monthLabel(inv.reference_year, inv.reference_month)} · ${inv.credit_card_name}`

/**
 * Comprovante de pagamento de fatura: a API sugere a fatura em aberto do cartão (pelo banco e
 * pelo valor) e a pessoa confirma com a conta de onde saiu o dinheiro.
 */
export function InvoicePaymentReview({ payment, accounts, onPaid, onAsExpense, onSendInvoice }: Props) {
  const queryClient = useQueryClient()
  const [invoiceId, setInvoiceId] = useState<number | null>(payment.invoice?.invoice_id ?? null)
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null)

  const options = payment.candidates.length > 0 ? payment.candidates : payment.invoice ? [payment.invoice] : []
  const invoice =
    options.find((c) => c.invoice_id === invoiceId) ??
    (payment.invoice?.invoice_id === invoiceId ? payment.invoice : null)
  const account = accounts.find((a) => a.id === accountId)
  const amount = payment.amount_paid ?? invoice?.remaining_amount ?? 0
  const alreadyPaid = payment.status === 'already_paid'
  const partial = Boolean(invoice) && amount < (invoice?.remaining_amount ?? 0) - 0.005

  const pay = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('Escolha a fatura que você pagou.')
      if (!account) throw new Error('Escolha a conta de onde saiu o pagamento.')
      await invoicesApi.pay(invoice.invoice_id, {
        amount,
        payment_account_id: account.id,
        payment_date: payment.payment_date ?? undefined,
      })
      await invalidateCreditCardQueries(queryClient)
    },
    onSuccess: () =>
      invoice &&
      onPaid({
        cardName: invoice.credit_card_name,
        month: invoice.reference_month,
        year: invoice.reference_year,
        amount,
        fullyPaid: !partial,
      }),
    onError: (err) =>
      Alert.alert(
        'Não foi possível marcar como paga',
        err instanceof Error && !(err as any).response ? err.message : getApiErrorMessage(err, 'Tente de novo em instantes.')
      ),
  })

  const pickInvoice = () =>
    Alert.alert('Qual fatura você pagou?', undefined, [
      ...options.map((c) => ({
        text: `${invoiceLabel(c)} (${formatCurrency(c.remaining_amount)})`,
        onPress: () => setInvoiceId(c.invoice_id),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ])

  const pickAccount = () =>
    Alert.alert('De qual conta saiu o pagamento?', undefined, [
      ...accounts.map((a) => ({ text: a.name, onPress: () => setAccountId(a.id) })),
      { text: 'Cancelar', style: 'cancel' as const },
    ])

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        <Text style={styles.heroCaption}>Comprovante de pagamento de fatura</Text>
        <Text style={styles.heroAmount}>{formatCurrency(amount)}</Text>
        {payment.payment_date && <Text style={styles.heroCaption}>Pago em {formatDate(payment.payment_date)}</Text>}
      </View>

      {alreadyPaid && payment.invoice ? (
        <View style={[styles.box, styles.boxOk]}>
          <Feather name="check-circle" size={20} color={darkTheme.success} />
          <View style={styles.texts}>
            <Text style={styles.title}>Esta fatura já está paga</Text>
            <Text style={styles.details}>{invoiceLabel(payment.invoice)}</Text>
          </View>
        </View>
      ) : invoice ? (
        <View style={[styles.box, styles.boxNew]}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Feather name="file-text" size={18} color={darkTheme.accent} />
            </View>
            <View style={styles.texts}>
              <Text style={styles.caption}>
                {payment.status === 'matched' && invoice.invoice_id === payment.invoice?.invoice_id
                  ? 'Encontramos a fatura'
                  : 'Fatura escolhida'}
              </Text>
              <Text style={styles.title}>{invoiceLabel(invoice)}</Text>
              <Text style={styles.details}>
                Vence {formatDate(invoice.due_date)} · falta {formatCurrency(invoice.remaining_amount)}
              </Text>
            </View>
          </View>
          {partial && (
            <Text style={styles.warn}>
              O valor pago é menor que o que falta: a fatura fica parcialmente paga.
            </Text>
          )}
          {options.length > 1 && (
            <Pressable accessibilityRole="button" onPress={pickInvoice}>
              <Text style={styles.link}>Foi outra fatura</Text>
            </Pressable>
          )}
        </View>
      ) : options.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={pickInvoice}
          style={({ pressed }) => [styles.box, styles.boxWarn, pressed && styles.pressed]}
        >
          <Feather name="help-circle" size={20} color={darkTheme.warning} />
          <View style={styles.texts}>
            <Text style={styles.caption}>Mais de uma fatura em aberto combina</Text>
            <Text style={styles.title}>Escolha a fatura que você pagou</Text>
          </View>
          <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
        </Pressable>
      ) : (
        <View style={[styles.box, styles.boxWarn]}>
          <Feather name="info" size={20} color={darkTheme.warning} />
          <View style={styles.texts}>
            <Text style={styles.title}>Não achamos a fatura em aberto</Text>
            <Text style={styles.details}>
              Envie a fatura deste cartão primeiro: o pagamento é ligado a ela. Ou lance o comprovante como
              despesa comum.
            </Text>
          </View>
        </View>
      )}

      {invoice && !alreadyPaid && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Conta de origem</Text>
          {accounts.length > 0 ? (
            <Pressable style={styles.fieldInput} onPress={pickAccount}>
              <Text style={styles.fieldValue}>{account?.name ?? 'Escolha a conta'}</Text>
              <Feather name="chevron-down" size={16} color={darkTheme.textMuted} />
            </Pressable>
          ) : (
            <Text style={styles.details}>Cadastre uma conta (corrente ou poupança) para registrar o pagamento.</Text>
          )}
        </View>
      )}

      {invoice && !alreadyPaid ? (
        <Pressable
          accessibilityRole="button"
          disabled={pay.isPending || !account}
          onPress={() => pay.mutate()}
          style={({ pressed }) => [styles.primary, !account && styles.disabled, pressed && styles.pressed]}
        >
          {pay.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryText}>Marcar fatura do {invoice.credit_card_name} como paga</Text>
          )}
        </Pressable>
      ) : !alreadyPaid && options.length === 0 ? (
        <Pressable accessibilityRole="button" onPress={onSendInvoice} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Enviar a fatura</Text>
        </Pressable>
      ) : null}

      {!alreadyPaid && (
        <Pressable accessibilityRole="button" onPress={onAsExpense} style={styles.secondary}>
          <Text style={styles.link}>Lançar como despesa comum</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 16 },
  hero: {
    alignItems: 'center',
    gap: 4,
    padding: 20,
    borderRadius: 16,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  heroCaption: { fontSize: 13, color: darkTheme.textSecondary },
  heroAmount: { fontSize: 30, fontWeight: '700', color: darkTheme.text },
  box: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, flexDirection: 'row', alignItems: 'center' },
  boxOk: { backgroundColor: darkTheme.surface, borderColor: darkTheme.border },
  boxNew: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: darkTheme.primary,
  },
  boxWarn: { backgroundColor: darkTheme.warningBackground, borderColor: darkTheme.warningBorder },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  texts: { flex: 1, gap: 2 },
  caption: { fontSize: 12, color: darkTheme.textSecondary },
  title: { fontSize: 15, fontWeight: '600', color: darkTheme.text },
  details: { fontSize: 13, color: darkTheme.textSecondary },
  warn: { fontSize: 13, color: darkTheme.warning },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: darkTheme.textSecondary, fontWeight: '600' },
  fieldInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: { fontSize: 15, color: darkTheme.text },
  primary: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  secondary: { alignItems: 'center', paddingVertical: 8 },
  link: { color: darkTheme.accent, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.75 },
})
