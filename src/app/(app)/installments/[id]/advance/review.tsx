import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { ActionButton } from '@/components/installments/ActionButton'
import { useInstallmentDetail } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function AdvanceReviewScreen() {
  const insets = useSafeAreaInsets()
  const { id, selected } = useLocalSearchParams<{ id: string; selected: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)

  const selectedInstallments = useMemo(() => {
    if (!selected) return []
    return selected.split(',').map((n) => parseInt(n))
  }, [selected])

  const totalAmount = useMemo(() => {
    if (!series) return 0
    return series.installment_amount * selectedInstallments.length
  }, [series, selectedInstallments.length])

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <ActivityIndicator size="large" color={darkTheme.primary} />
      </View>
    )
  }

  if (error || !series) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <Feather name="alert-circle" size={48} color={darkTheme.textMuted} />
        <Text style={styles.errorText}>Erro ao carregar série</Text>
      </View>
    )
  }

  const handleConfirm = () => {
    if (seriesId) {
      router.push(`/installments/${seriesId}/advance/confirm?selected=${selectedInstallments.join(',')}`)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={darkTheme.text} />
        </Pressable>
        <Text style={styles.title}>Revisar Seleção</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parcelas Selecionadas</Text>
          <Text style={styles.cardDescription}>
            Confirme as parcelas que deseja marcar como pagas
          </Text>
        </View>

        {/* Selected Installments List */}
        <View style={styles.card}>
          {selectedInstallments.map((installmentNumber, index) => {
            const dueDate = new Date(series.first_installment_date)
            dueDate.setMonth(dueDate.getMonth() + installmentNumber - 1)

            return (
              <View key={installmentNumber}>
                <View style={styles.installmentRow}>
                  <View style={styles.checkmark}>
                    <Feather name="check" size={16} color={darkTheme.primary} />
                  </View>
                  <View style={styles.installmentInfo}>
                    <Text style={styles.installmentNumber}>
                      Parcela {installmentNumber}
                    </Text>
                    <Text style={styles.installmentDate}>
                      {dueDate.toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Text style={styles.installmentAmount}>
                    R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {index < selectedInstallments.length - 1 && <View style={styles.divider} />}
              </View>
            )
          })}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Parcelas a Pagar</Text>
            <Text style={styles.summaryValue}>{selectedInstallments.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor por Parcela</Text>
            <Text style={styles.summaryValue}>
              R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Valor Total</Text>
            <Text style={styles.summaryValueTotal}>
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Info Alert */}
        <View style={styles.alertCard}>
          <Feather name="info" size={20} color={darkTheme.primary} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Atenção</Text>
            <Text style={styles.alertDescription}>
              Você está prestes a marcar {selectedInstallments.length} parcela{selectedInstallments.length !== 1 ? 's' : ''} como pagas. Esta ação não poderá ser desfeita.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <ActionButton
            label="Cancelar"
            onPress={() => router.back()}
            variant="secondary"
          />
          <ActionButton
            label="Confirmar"
            onPress={handleConfirm}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  cardDescription: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentInfo: {
    flex: 1,
    gap: 2,
  },
  installmentNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  installmentDate: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  installmentAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.accent,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 4,
    paddingBottom: 0,
  },
  summaryLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  summaryLabelTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
    borderRadius: 12,
    padding: 12,
  },
  alertContent: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  alertDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: darkTheme.textMuted,
    marginTop: 12,
  },
})
