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

export default function EditSuccessScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)
  const { data: installments } = useInstallmentDetails(seriesId)

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
  const paidInstallments = installments?.filter((inst) => inst.number <= nonSelectableCount) || []
  const futureInstallments = installments?.filter((inst) => inst.number > nonSelectableCount) || []

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
        <Text style={styles.title}>Parcelamento atualizado</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.checkmarkCircle}>
            <Feather name="check" size={32} color="#22c55e" />
          </View>
          <Text style={styles.successTitle}>Parcelamento atualizado</Text>
          <Text style={styles.successDescription}>
            A descrição foi alterada. Valores, faturas e histórico permanecem como antes.
          </Text>
        </View>

        {/* Installment Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notebook para trabalho</Text>
          <Text style={styles.cardAmount}>
            R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.cardDetails}>
            6x de R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Nubank
          </Text>
        </View>

        {/* Purchase Data */}
        <View>
          <Text style={styles.sectionTitle}>Categoria</Text>
          <Text style={styles.sectionValue}>Eletrônicos</Text>

          <Text style={[styles.sectionTitle, styles.topMargin]}>Compra original</Text>
          <Text style={styles.sectionValue}>10/08/2026</Text>

          <Text style={[styles.sectionTitle, styles.topMargin]}>Parcelas pagas</Text>
          <Text style={styles.sectionValue}>1 de 6</Text>
        </View>

        {/* History */}
        <View>
          <Text style={styles.sectionTitle}>Histórico mantido</Text>

          {paidInstallments.map((installment) => (
            <View key={installment.number} style={styles.historyItem}>
              <View style={styles.historyCheckbox}>
                <Feather name="check-square" size={20} color={darkTheme.primary} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>
                  Parcela {installment.number} de {series.installment_count}
                </Text>
                <Text style={styles.historyDate}>
                  Fatura de {new Date(installment.expected_date || series.first_installment_date).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.historyStatus}>
                  {installment.number === 1 ? 'Paga - preservada' : 'Já lançada - a pagar'}
                </Text>
              </View>
              <Text style={styles.historyAmount}>
                R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}

          <View style={styles.preservedNote}>
            <Text style={styles.preservedNoteText}>
              Estas parcelas não serão alteradas.
            </Text>
          </View>
        </View>

        {/* Future Installments */}
        <View>
          <Text style={styles.sectionTitle}>Parcelas futuras</Text>

          {futureInstallments.map((installment) => (
            <View key={installment.number} style={styles.futureItem}>
              <View style={styles.futureCheckbox}>
                <Feather name="check-square" size={20} color={darkTheme.primary} />
              </View>
              <View style={styles.futureInfo}>
                <Text style={styles.futureTitle}>
                  Parcela {installment.number} de {series.installment_count}
                </Text>
                <Text style={styles.futureDate}>
                  Fatura de {new Date(installment.expected_date || series.first_installment_date).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.futureStatus}>Futura</Text>
              </View>
              <Text style={styles.futureAmount}>
                R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Soma das parcelas 3 a 6</Text>
            <Text style={styles.summaryAmount}>
              R$ {(series.installment_amount * futureInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.infoNote}>
            <Text style={styles.infoNoteText}>
              Parcelas 3 a 6: R$ {(series.installment_amount * futureInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Distribuição original mantida, sem antecipação.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.viewButton}
            onPress={() => {
              if (seriesId) {
                router.push(`/installments/${seriesId}`)
              }
            }}
          >
            <Text style={styles.viewButtonText}>Ver parcelamento</Text>
          </Pressable>
          <Pressable
            style={styles.backListButton}
            onPress={() => router.push('/installments')}
          >
            <Text style={styles.backListButtonText}>Voltar a parcelamentos</Text>
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
  successBanner: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  cardDetails: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.textMuted,
    marginBottom: 8,
  },
  topMargin: {
    marginTop: 16,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  historyCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  historyDate: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
  },
  historyStatus: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.text,
    marginTop: 2,
  },
  preservedNote: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    borderRadius: 8,
    marginTop: 4,
  },
  preservedNoteText: {
    fontSize: 12,
    color: darkTheme.textMuted,
    fontStyle: 'italic',
  },
  futureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  futureCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  futureInfo: {
    flex: 1,
    gap: 2,
  },
  futureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  futureDate: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
  },
  futureStatus: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  futureAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.text,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
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
  infoNote: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  infoNoteText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  viewButton: {
    backgroundColor: darkTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  backListButton: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backListButtonText: {
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
