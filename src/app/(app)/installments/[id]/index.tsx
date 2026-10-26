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

import { InstallmentTimeline } from '@/components/installments/InstallmentTimeline'
import { ActionButton } from '@/components/installments/ActionButton'
import { useInstallmentDetail, useInstallmentDetails } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function InstallmentDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const seriesId = id ? parseInt(id) : null

  const { data: series, isLoading, error } = useInstallmentDetail(seriesId)
  const { data: installments, isLoading: detailsLoading, error: detailsError } = useInstallmentDetails(seriesId)

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

  const progressPercent = (series.paid_count / series.installment_count) * 100
  const canAdvance = series.status === 'active' && series.remaining_count > 0

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
        <Text style={styles.title}>{series.merchant_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Total da compra</Text>
          <Text style={styles.mainAmount}>
            R$ {series.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>

          <Text style={styles.installmentDetails}>
            {series.installment_count}x de R$ {series.installment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no {series.merchant_name}, compra em {new Date(series.first_installment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {series.paid_count} de {series.installment_count} parcelas lançadas, restam R$ {series.remaining_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Installments Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cronograma de Parcelas</Text>
          <Text style={styles.cardSubtitle}>
            Visualize o status de cada parcela
          </Text>
          {detailsLoading && (
            <View style={styles.timelineLoading}>
              <ActivityIndicator size="small" color={darkTheme.primary} />
              <Text style={styles.timelineLoadingText}>Carregando...</Text>
            </View>
          )}
          {detailsError && (
            <View style={styles.timelineError}>
              <Feather name="alert-circle" size={16} color={darkTheme.textMuted} />
              <Text style={styles.timelineErrorText}>Erro ao carregar parcelas</Text>
            </View>
          )}
          {installments && installments.length > 0 && (
            <InstallmentTimeline installments={installments} installmentAmount={series.installment_amount} />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {canAdvance && (
            <ActionButton
              label="Avançar Parcelas"
              onPress={() => router.push(`/installments/${seriesId}/advance`)}
              variant="primary"
            />
          )}
          <ActionButton
            label="Editar Série"
            onPress={() => router.push(`/installments/${seriesId}/edit`)}
            variant="secondary"
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
  cardSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: darkTheme.text,
  },
  installmentDetails: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  infoLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: darkTheme.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginTop: 4,
  },
  timelineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  timelineLoadingText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  timelineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  timelineErrorText: {
    fontSize: 12,
    color: darkTheme.textMuted,
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
