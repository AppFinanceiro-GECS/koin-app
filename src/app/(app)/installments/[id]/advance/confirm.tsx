import { useEffect, useState } from 'react'
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
import { useMarkInstallmentsPaid } from '@/hooks/useInstallments'
import { darkTheme } from '@/theme/colors'

export default function AdvanceConfirmScreen() {
  const insets = useSafeAreaInsets()
  const { id, selected } = useLocalSearchParams<{ id: string; selected: string }>()
  const seriesId = id ? parseInt(id) : null
  const selectedInstallments = selected ? selected.split(',').map((n) => parseInt(n)) : []
  const upToInstallment = Math.max(...selectedInstallments)

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const markInstallmentsMutation = useMarkInstallmentsPaid()

  useEffect(() => {
    const submitMutation = async () => {
      if (!seriesId || selectedInstallments.length === 0 || hasSubmitted) return

      setHasSubmitted(true)
      try {
        await markInstallmentsMutation.mutateAsync({
          seriesId,
          upTo: upToInstallment,
        })
      } catch (err) {
        console.error('Error marking installments paid:', err)
      }
    }

    submitMutation()
  }, [seriesId, selectedInstallments.length, upToInstallment, hasSubmitted, markInstallmentsMutation])

  const isLoading = markInstallmentsMutation.isPending
  const isSuccess = markInstallmentsMutation.isSuccess
  const isError = markInstallmentsMutation.isError
  const errorMessage = markInstallmentsMutation.error?.message || 'Erro ao marcar parcelas como pagas'

  const handleBackToList = () => {
    router.push('/installments')
  }

  const handleRetry = () => {
    setHasSubmitted(false)
    markInstallmentsMutation.reset()
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => {
            if (!isLoading) router.back()
          }}
          disabled={isLoading}
        >
          <Feather name="chevron-left" size={24} color={darkTheme.text} />
        </Pressable>
        <Text style={styles.title}>Processando</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.stateContainer}>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color={darkTheme.primary} />
            </View>
            <Text style={styles.stateTitle}>Marcando parcelas como pagas</Text>
            <Text style={styles.stateDescription}>
              Aguarde enquanto processamos sua solicitação...
            </Text>
          </View>
        )}

        {/* Success State */}
        {isSuccess && !isLoading && (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, styles.successIcon]}>
              <Feather name="check-circle" size={48} color={darkTheme.primary} />
            </View>
            <Text style={styles.stateTitle}>Sucesso!</Text>
            <Text style={styles.stateDescription}>
              {selectedInstallments.length} parcela{selectedInstallments.length !== 1 ? 's' : ''} marcada{selectedInstallments.length !== 1 ? 's' : ''} como paga{selectedInstallments.length !== 1 ? 's' : ''} com sucesso.
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Detalhes da Operação</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Parcelas Processadas</Text>
                <Text style={styles.detailValue}>{selectedInstallments.length}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Até a Parcela</Text>
                <Text style={styles.detailValue}>{upToInstallment}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Feather name="alert-circle" size={48} color={darkTheme.error || '#ef4444'} />
            </View>
            <Text style={styles.stateTitle}>Erro ao processar</Text>
            <Text style={styles.stateDescription}>
              {errorMessage}
            </Text>

            <View style={[styles.card, styles.errorCard]}>
              <Text style={styles.errorCardText}>
                Verifique sua conexão e tente novamente, ou entre em contato com o suporte se o problema persistir.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isLoading && isSuccess && (
            <ActionButton
              label="Voltar para Parcelamentos"
              onPress={handleBackToList}
              variant="primary"
            />
          )}
          {!isLoading && isError && (
            <>
              <ActionButton
                label="Tentar Novamente"
                onPress={handleRetry}
                variant="primary"
              />
              <ActionButton
                label="Cancelar"
                onPress={() => router.back()}
                variant="secondary"
              />
            </>
          )}
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
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  errorIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  detailLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.text,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorCardText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
  actions: {
    gap: 8,
    marginTop: 16,
  },
})
