import { Pressable, StyleSheet, Text, View } from 'react-native'
import { darkTheme } from '@/theme/colors'
import type { InstallmentSeriesResponse } from '@/types/installment'

interface InstallmentRowProps {
  series: InstallmentSeriesResponse
  onPress: () => void
}

export function InstallmentRow({ series, onPress }: InstallmentRowProps) {
  const progressPercent = (series.paid_count / series.installment_count) * 100

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.description}>{series.description}</Text>
          <Text style={styles.merchant}>{series.merchant_name}</Text>
        </View>

        <View style={styles.amountsSection}>
          <View style={styles.amountColumn}>
            <Text style={styles.amountLabel}>Parcela</Text>
            <Text style={styles.amountValue}>
              R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.amountColumn}>
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
                  backgroundColor: darkTheme.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {series.paid_count}/{series.installment_count} parcelas ({Math.round(progressPercent)}%)
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    gap: 10,
  },
  titleSection: {
    gap: 2,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  merchant: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  amountsSection: {
    flexDirection: 'row',
    gap: 16,
  },
  amountColumn: {
    flex: 1,
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
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: darkTheme.textMuted,
  },
})
