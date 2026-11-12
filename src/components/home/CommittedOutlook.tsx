import { StyleSheet, Text, View } from 'react-native'

import { formatCurrency } from '@/lib/format'
import { darkTheme } from '@/theme/colors'
import type { InvoiceOutlook } from '@/types/api'

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface Props {
  outlook: InvoiceOutlook | undefined
  family: boolean
}

/** Parcelas já compradas, por fatura dos próximos meses (GET /invoices/outlook) */
export function CommittedOutlook({ outlook, family }: Props) {
  const months = outlook?.months ?? []
  const max = Math.max(...months.map((m) => m.total), 1)
  const total = outlook?.total ?? 0

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {family ? 'Já comprometido pela família' : 'Já comprometido'} nos próximos {months.length || 6} meses
      </Text>
      <Text style={styles.total}>{formatCurrency(total)}</Text>
      <Text style={styles.hint}>
        {total > 0
          ? 'Parcelas que já foram compradas e ainda vão cair nas faturas.'
          : 'Nenhuma parcela em aberto. Compras parceladas aparecem aqui assim que entram numa fatura.'}
      </Text>

      {months.length > 0 && (
        <View style={styles.bars} accessibilityRole="summary">
          {months.map((m, index) => {
            const height = m.total > 0 ? Math.max((m.total / max) * 100, 6) : 0
            return (
              <View
                key={`${m.year}-${m.month}`}
                style={styles.barCol}
                accessible
                accessibilityLabel={`${SHORT_MONTHS[m.month - 1]}: ${formatCurrency(m.total)}`}
              >
                <View style={styles.barTrack}>
                  {height > 0 && (
                    <View
                      style={[styles.bar, { height: `${height}%` }, index === 0 && styles.barCurrent]}
                    />
                  )}
                </View>
                <Text style={[styles.month, index === 0 && styles.monthCurrent]}>
                  {SHORT_MONTHS[m.month - 1]}
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  label: { fontSize: 13, color: darkTheme.textSecondary },
  total: { fontSize: 28, fontWeight: '700', color: darkTheme.text },
  hint: { fontSize: 13, lineHeight: 18, color: darkTheme.textMuted },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 110, marginTop: 10 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: 84, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, backgroundColor: 'rgba(124, 58, 237, 0.55)' },
  barCurrent: { backgroundColor: darkTheme.primary },
  month: { fontSize: 12, color: darkTheme.textMuted },
  monthCurrent: { color: darkTheme.accent, fontWeight: '600' },
})
