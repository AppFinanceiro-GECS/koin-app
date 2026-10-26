import { StyleSheet, Text, View } from 'react-native'
import { darkTheme } from '@/theme/colors'
import type { InstallmentStatusResponse } from '@/types/installment'

interface InstallmentTimelineProps {
  installments: InstallmentStatusResponse[]
  installmentAmount?: number
}

const statusConfig = {
  paid: { label: 'Paga', backgroundColor: 'rgba(34, 197, 94, 0.1)', textColor: '#22c55e' },
  registered: { label: 'Registrada', backgroundColor: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' },
  pending: { label: 'A pagar', backgroundColor: 'rgba(245, 158, 11, 0.1)', textColor: '#f59e0b' },
}

export function InstallmentTimeline({ installments, installmentAmount = 500 }: InstallmentTimelineProps) {
  if (installments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma parcela</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {installments.map((installment, index) => {
        const config = statusConfig[installment.status as keyof typeof statusConfig]
        const expectedDate = installment.expected_date
        const dateObj = expectedDate ? new Date(expectedDate) : null
        const monthName = dateObj
          ? new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toLocaleDateString('pt-BR', {
              month: 'long',
            })
          : ''

        return (
          <View key={index} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.stackIcon}>
                <View style={styles.stackBlock} />
                <View style={[styles.stackBlock, styles.stackBlockOffset]} />
              </View>

              <View style={styles.textContent}>
                <Text style={styles.installmentNumber}>
                  Parcela {installment.number} de {installments.length}
                </Text>
                <Text style={styles.invoiceDate}>
                  Fatura de {monthName}
                </Text>
              </View>

              <Text style={styles.amount}>
                R$ {installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text
                style={[
                  styles.statusText,
                  { color: config.textColor, backgroundColor: config.backgroundColor },
                ]}
              >
                {config.label}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: darkTheme.textMuted,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stackIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackBlock: {
    width: 16,
    height: 12,
    backgroundColor: darkTheme.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  stackBlockOffset: {
    position: 'absolute',
    opacity: 0.5,
    transform: [{ translateX: 6 }, { translateY: 6 }],
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  installmentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  invoiceDate: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  statusBadge: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
})
