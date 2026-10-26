import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'

import { useInstallmentDetail, useInstallmentDetails } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function AdvanceInstallmentsScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)
  const { data: installments } = useInstallmentDetails(seriesId)

  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([])

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
  const selectableInstallments = installments?.filter((inst) => inst.number > nonSelectableCount) || []
  const selectedAmount = selectedInstallments.reduce((sum, number) => {
    const inst = installments?.find((i) => i.number === number)
    return sum + (inst ? series.installment_amount : 0)
  }, 0)

  const toggleInstallment = (number: number) => {
    setSelectedInstallments((prev) =>
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]
    )
  }

  const getMonthName = (date: string) => {
    const dateObj = new Date(date)
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toLocaleDateString('pt-BR', {
      month: 'long',
    })
  }

  const getMonthYear = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }

  const handleReview = () => {
    if (selectedInstallments.length > 0 && seriesId) {
      router.push({
        pathname: `/installments/${seriesId}/advance/review`,
        params: {
          selected: selectedInstallments.join(','),
        },
      })
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
        <Text style={styles.title}>Antecipar parcelas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Info Card */}
        <LinearGradient
          colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardMerchant}>{series.merchant_name}</Text>
          </View>
          <Text style={styles.mainAmount}>
            R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.installmentDetails}>
            {series.installment_count}x de R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · compra em {new Date(series.first_installment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </Text>
        </LinearGradient>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Feather name="alert-circle" size={20} color={darkTheme.textMuted} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Registro no Koin</Text>
            <Text style={styles.warningText}>
              Registre aqui a antecipação confirmada com o banco. O Koin não executa pagamentos nem solicita a antecipação.
            </Text>
          </View>
        </View>

        {/* Non-selectable installments */}
        {installments && installments.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Histórico não selecionável</Text>
            {installments
              .filter((inst) => inst.number <= nonSelectableCount)
              .map((installment) => (
                <View key={installment.number} style={styles.installmentCard}>
                  <View style={styles.cardIcon}>
                    <Feather name="file-text" size={18} color={darkTheme.primary} />
                  </View>
                  <View style={styles.installmentInfo}>
                    <Text style={styles.installmentTitle}>
                      Parcela {installment.number} de {installments.length}
                    </Text>
                    <Text style={styles.installmentDate}>
                      Fatura de {installment.expected_date ? getMonthName(installment.expected_date) : 'N/A'} · {installment.expected_date ? new Date(installment.expected_date).getFullYear() : 'N/A'}
                    </Text>
                    <Text style={styles.installmentStatus}>
                      {installment.status === 'paid' ? 'Paga · preservada' : 'Já lançada · a pagar'}
                    </Text>
                  </View>
                  <Text style={styles.installmentAmount}>
                    R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            <Text style={styles.noteText}>Estas parcelas não serão alteradas.</Text>
          </View>
        )}

        {/* Selectable installments */}
        {selectableInstallments.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Selecione as parcelas futuras</Text>
            {selectableInstallments.map((installment) => (
              <Pressable
                key={installment.number}
                style={({ pressed }) => [
                  styles.selectableCard,
                  pressed && styles.selectableCardPressed,
                  selectedInstallments.includes(installment.number) && styles.selectableCardSelected,
                ]}
                onPress={() => toggleInstallment(installment.number)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedInstallments.includes(installment.number) && styles.checkboxSelected,
                  ]}
                >
                  {selectedInstallments.includes(installment.number) && (
                    <Feather name="check" size={14} color="#ffffff" />
                  )}
                </View>
                <View style={styles.cardIcon}>
                  <Feather name="file-text" size={18} color={darkTheme.primary} />
                </View>
                <View style={styles.installmentInfo}>
                  <Text style={styles.installmentTitle}>
                    Parcela {installment.number} de {installments?.length}
                  </Text>
                  <Text style={styles.installmentDate}>
                    Fatura de {installment.expected_date ? getMonthName(installment.expected_date) : 'N/A'} · {installment.expected_date ? new Date(installment.expected_date).getFullYear() : 'N/A'}
                  </Text>
                  <Text
                    style={[
                      styles.installmentStatus,
                      selectedInstallments.includes(installment.number) && styles.statusSelected,
                    ]}
                  >
                    {selectedInstallments.includes(installment.number) ? 'Selecionada' : 'Aberta'}
                  </Text>
                </View>
                <Text style={styles.installmentAmount}>
                  R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Summary */}
        {selectedInstallments.length > 0 && (
          <LinearGradient
            colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryLabel}>
              {selectedInstallments.length} parcela{selectedInstallments.length !== 1 ? 's' : ''} selecionada{selectedInstallments.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryAmount}>
              R$ {selectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryNote}>
              Parcelas {selectedInstallments.join(' e ')} · valor original, sem desconto
            </Text>
          </LinearGradient>
        )}

        {/* Destination Invoice */}
        <View>
          <Text style={styles.sectionTitle}>Fatura de destino</Text>
          <View style={styles.destinyCard}>
            <View style={styles.destinyRadio}>
              <View style={styles.destinyRadioDot} />
            </View>
            <View style={styles.destinyInfo}>
              <Text style={styles.destinyTitle}>{series.merchant_name} · {series.first_installment_date ? getMonthYear(series.first_installment_date) : 'N/A'}</Text>
              <Text style={styles.destinyDate}>Fecha em 24/10 · vence em 04/11</Text>
            </View>
          </View>
          <Text style={styles.noteText}>O valor confirmado pelo banco pode ser informado na revisão.</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.reviewButton, selectedInstallments.length === 0 && styles.reviewButtonDisabled]}
            onPress={handleReview}
            disabled={selectedInstallments.length === 0}
          >
            <Text style={styles.reviewButtonText}>Revisar antecipação</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancelar</Text>
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
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    gap: 4,
  },
  cardMerchant: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  installmentDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  warningText: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginTop: 8,
  },
  installmentCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  selectableCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  selectableCardPressed: {
    opacity: 0.8,
  },
  selectableCardSelected: {
    borderColor: darkTheme.primary,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: darkTheme.border,
  },
  checkboxSelected: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  statusSelected: {
    color: darkTheme.primary,
    fontWeight: '600',
  },
  cardIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 8,
  },
  installmentInfo: {
    flex: 1,
    gap: 2,
  },
  installmentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  installmentDate: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  installmentStatus: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  installmentAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  noteText: {
    fontSize: 11,
    color: darkTheme.textMuted,
    marginTop: 8,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  destinyCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 2,
    borderColor: darkTheme.primary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  destinyRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinyRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: darkTheme.primary,
  },
  destinyInfo: {
    flex: 1,
    gap: 2,
  },
  destinyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  destinyDate: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
  reviewButton: {
    backgroundColor: darkTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: darkTheme.textMuted,
    marginTop: 12,
  },
})
