import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { useInstallmentDetail, useInstallmentDetails } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function EditSeriesScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)
  const { data: installments } = useInstallmentDetails(seriesId)

  const [editableValues, setEditableValues] = useState<{ [key: number]: string }>({})
  const [hasChanges, setHasChanges] = useState(false)

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

  const handleValueChange = (installmentNumber: number, value: string) => {
    setEditableValues((prev) => ({
      ...prev,
      [installmentNumber]: value,
    }))
    setHasChanges(true)
  }

  const getMonthName = (date: string) => {
    const dateObj = new Date(date)
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toLocaleDateString('pt-BR', {
      month: 'long',
    })
  }

  const handleReview = () => {
    if (!hasChanges || !seriesId) return
    router.push(`/installments/${seriesId}/edit/confirm?edited=${encodeURIComponent(JSON.stringify(editableValues))}`)
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
        <Text style={styles.title}>Editar parcelamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Structure Card - Original */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Estrutura original</Text>
          <View style={styles.cardContent}>
            <Text style={styles.merchantName}>{series.merchant_name}</Text>
            <Text style={styles.amount}>
              R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.details}>
              {series.merchant_name} - {series.installment_count} parcelas de R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Purchase Data */}
        <View>
          <Text style={styles.sectionTitle}>Dados da compra</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descrição</Text>
            <Text style={styles.infoValue}>{series.description}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoria</Text>
            <Text style={styles.infoValue}>Eletrônicos</Text>
          </View>

          <View style={styles.infoGroup}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data original</Text>
              <Text style={styles.infoValue}>
                {new Date(series.first_installment_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cartão original</Text>
              <Text style={styles.infoValue}>{series.merchant_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total e quantidade</Text>
              <Text style={styles.infoValue}>
                R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {series.installment_count} parcelas
              </Text>
            </View>

            <Text style={styles.noteText}>Estrutura original preservada.</Text>
          </View>
        </View>

        {/* Protected History */}
        <View>
          <View style={styles.warningCard}>
            <Feather name="alert-circle" size={16} color={darkTheme.textMuted} />
            <Text style={styles.warningText}>Histórico protegido</Text>
          </View>
          <Text style={styles.historyText}>
            Parcela 1 de setembro: Paga. Parcela 2 de outubro: já lançada, a pagar. Nenhuma delas será alterada nesta edição.
          </Text>
        </View>

        {/* Editable Installments */}
        <View>
          <Text style={styles.sectionTitle}>Distribuição das parcelas futuras</Text>
          <Text style={styles.editInstruction}>
            Revise o valor e a fatura das parcelas 3 a {series.installment_count}. Neste exemplo, a distribuição original é mantida.
          </Text>

          {editableInstallments.map((installment) => (
            <View key={installment.number} style={styles.editableCard}>
              <Text style={styles.installmentTitle}>Parcela {installment.number} de {series.installment_count}</Text>

              <View style={styles.installmentFields}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Valor</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>R$</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="500,00"
                      placeholderTextColor={darkTheme.textMuted}
                      value={
                        editableValues[installment.number] ||
                        series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      }
                      onChangeText={(value) => handleValueChange(installment.number, value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Fatura / competência</Text>
                  <View style={styles.dateField}>
                    <Text style={styles.dateValue}>
                      {installment.expected_date ? getMonthName(installment.expected_date) : 'N/A'} / {new Date(installment.expected_date || series.first_installment_date).getFullYear()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Future Sum */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Soma futura - parcelas 3 a {series.installment_count}</Text>
          <Text style={styles.summaryAmount}>
            R$ {(series.installment_amount * editableInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.summaryNote}>
            ✓ Soma compatível com o remanescente. Todos os valores devem ser positivos e somar R$ {(series.installment_amount * editableInstallments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.reviewButton, !hasChanges && styles.reviewButtonDisabled]}
            onPress={handleReview}
            disabled={!hasChanges}
          >
            <Text style={styles.reviewButtonText}>Revisar alterações</Text>
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.textMuted,
    textTransform: 'uppercase',
  },
  cardContent: {
    gap: 12,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  details: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 8,
  },
  infoRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
  },
  infoGroup: {
    gap: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 12,
    color: darkTheme.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderWidth: 1,
    borderColor: darkTheme.warning,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.warning,
  },
  historyText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  editInstruction: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  editableCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  installmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 12,
  },
  installmentFields: {
    gap: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.textMuted,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: darkTheme.text,
    fontWeight: '500',
  },
  dateField: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
    textTransform: 'capitalize',
  },
  summaryCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.textMuted,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.primary,
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  reviewButton: {
    backgroundColor: darkTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButton: {
    fontSize: 14,
    fontWeight: '600',
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
