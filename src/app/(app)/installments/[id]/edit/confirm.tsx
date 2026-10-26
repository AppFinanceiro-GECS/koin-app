import { useState } from 'react'
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

import { useInstallmentDetail, useInstallmentDetails } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function ConfirmEditScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)
  const { data: installments } = useInstallmentDetails(seriesId)

  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const nonSelectableCount = series.paid_count + 1
  const editableInstallments = installments?.filter((inst) => inst.number > nonSelectableCount) || []

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (seriesId) {
        router.push(`/installments/${seriesId}/edit/success`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Feather name="chevron-left" size={24} color={darkTheme.text} />
        </Pressable>
        <Text style={styles.title}>Revisar edição</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* What Will Change */}
        <Text style={styles.sectionTitle}>O que será alterado</Text>

        {/* Description Change */}
        <View style={styles.changeCard}>
          <View style={styles.changeRow}>
            <View style={styles.changeField}>
              <Text style={styles.changeLabel}>DESCRIÇÃO ORIGINAL</Text>
              <Text style={styles.changeValue}>{series.description}</Text>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <Feather name="arrow-down" size={20} color={darkTheme.primary} />
          </View>

          <View style={styles.changeRow}>
            <View style={styles.changeField}>
              <Text style={styles.changeLabel}>NOVA DESCRIÇÃO</Text>
              <Text style={[styles.changeValue, styles.newValue]}>
                Notebook para trabalho
              </Text>
            </View>
          </View>
        </View>

        {/* Other Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Categoria mantida</Text>
            <Text style={styles.infoValue}>Eletrônicos</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data original mantida</Text>
            <Text style={styles.infoValue}>10/08/2026</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cartão mantido</Text>
            <Text style={styles.infoValue}>Nubank</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total da compra inalterado</Text>
          <Text style={styles.totalAmount}>
            R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.totalDescription}>
            6x de R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - valores e faturas intactos
          </Text>
        </View>

        {/* Future Installments */}
        <View>
          <Text style={styles.sectionTitle}>Parcelas futuras preservadas</Text>

          {editableInstallments.map((installment) => (
            <View key={installment.number} style={styles.installmentItem}>
              <View style={styles.checkmarkBox}>
                <Feather name="check-square" size={20} color={darkTheme.primary} />
              </View>
              <View style={styles.installmentInfo}>
                <Text style={styles.installmentTitle}>
                  Parcela {installment.number} de {series.installment_count}
                </Text>
                <Text style={styles.installmentDate}>
                  Fatura de {new Date(installment.expected_date || series.first_installment_date).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.installmentAmount}>
                R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Soma das parcelas 3 a 6</Text>
            <Text style={styles.summaryAmount}>
              R$ {(series.installment_amount * editableInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <Text style={styles.noteCheckmark}>✓</Text>
            </View>
            <Text style={styles.noteText}>
              Valores positivos. Soma futura de R$ {(series.installment_amount * editableInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, compatível com o remanescente das parcelas 3 a 6.
            </Text>
          </View>
        </View>

        {/* History Warning */}
        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Feather name="alert-circle" size={20} color="#dc2626" />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Histórico preservado</Text>
            <Text style={styles.warningText}>
              Setembro: parcela 1 paga. Outubro: parcela 2 já lançada, a pagar. Nenhuma muda até confirmar. Esta edição altera apenas a descrição.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar alterações</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Voltar</Text>
          </Pressable>
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
    gap: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.text,
  },
  changeCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  changeRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  changeField: {
    gap: 4,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: darkTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
  },
  newValue: {
    color: darkTheme.primary,
    fontWeight: '600',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: darkTheme.surfaceSecondary,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  totalCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.textMuted,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  totalDescription: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  installmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  checkmarkBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentInfo: {
    flex: 1,
    gap: 2,
  },
  installmentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  installmentDate: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
  },
  installmentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  noteIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCheckmark: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  warningIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  warningText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    backgroundColor: darkTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  errorText: {
    fontSize: 14,
    color: darkTheme.textMuted,
    marginTop: 12,
  },
})
