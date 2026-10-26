import { Pressable, StyleSheet, Text, View } from 'react-native'
import { darkTheme } from '@/theme/colors'
import type { InstallmentSeriesResponse, InstallmentSeriesStatus } from '@/types/installment'

interface InstallmentSeriesCardProps {
  series: InstallmentSeriesResponse
  onPress: () => void
}

const statusColors: Record<InstallmentSeriesStatus, { bg: string; text: string }> = {
  active: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
  completed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
}

const statusLabels: Record<InstallmentSeriesStatus, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export function InstallmentSeriesCard({ series, onPress }: InstallmentSeriesCardProps) {
  const colors = statusColors[series.status]
  const statusLabel = statusLabels[series.status]
  const progressPercent = (series.paid_count / series.installment_count) * 100

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.merchant}>{series.merchant_name}</Text>
          <Text style={styles.description}>{series.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.amounts}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>
            R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Parcelas</Text>
          <Text style={styles.amountValue}>
            {series.paid_count}/{series.installment_count}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Restante</Text>
          <Text style={styles.amountValue}>
            R$ {series.remaining_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.text,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercent)}% pago</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  merchant: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  description: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: darkTheme.textMuted,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textAlign: 'right',
  },
})
