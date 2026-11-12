import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { invoiceService } from '@/services/invoiceService'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyHint: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  cardTitleText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  cardSubtitleText: {
    color: '#64748b',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountBox: {
    flex: 1,
  },
  amountLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  amountValue: {
    color: '#ffffff',
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#9333ea',
  },
  progressText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
})

/** "2027-01-15" -> "15/01" sem passar por Date (que no Brasil voltaria um dia) */
function shortDate(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split('-')
  return day && month ? `${day}/${month}` : iso
}

export default function InvoicesScreen() {
  const router = useRouter()
  const { creditCardId, creditCardName } = useLocalSearchParams<{
    creditCardId?: string
    creditCardName?: string
  }>()

  const {
    data: invoices = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['invoices', creditCardId],
    queryFn: () => invoiceService.listInvoices(creditCardId ? parseInt(creditCardId) : undefined, undefined, 50),
  })

  const statusColors: Record<string, { backgroundColor: string; textColor: string; label: string }> = {
    open: { backgroundColor: 'rgba(30, 58, 138, 0.3)', textColor: '#60a5fa', label: 'Aberta' },
    closed: { backgroundColor: 'rgba(113, 63, 18, 0.3)', textColor: '#facc15', label: 'Fechada' },
    paid: { backgroundColor: 'rgba(20, 83, 45, 0.3)', textColor: '#4ade80', label: 'Paga' },
    partial: { backgroundColor: 'rgba(124, 45, 18, 0.3)', textColor: '#fb923c', label: 'Parcial' },
    overdue: { backgroundColor: 'rgba(127, 29, 29, 0.3)', textColor: '#f87171', label: 'Vencida' },
  }

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
        onPress={() => router.back()}
        style={styles.headerIcon}
      >
        <Ionicons name="chevron-back" size={24} color="#ffffff" />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {creditCardName ? `Faturas · ${creditCardName}` : 'Faturas'}
      </Text>
      {creditCardId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar ou excluir cartão"
          hitSlop={8}
          onPress={() => router.push({ pathname: '/credit-card/modal', params: { id: creditCardId } } as any)}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={16} color="#a855f7" />
        </Pressable>
      ) : (
        <View style={styles.headerIcon} />
      )}
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        {header}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {header}

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch() }} tintColor="#a855f7" />}
      >
        {isError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>
              {getApiErrorMessage(error, 'Não foi possível carregar as faturas. Puxe para baixo para tentar de novo.')}
            </Text>
          </View>
        ) : invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>Nenhuma fatura ainda</Text>
            <Text style={styles.emptyHint}>
              As faturas aparecem quando você lança compras no cartão ou importa o PDF da fatura.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {invoices.map((invoice) => {
              const statusConfig = statusColors[invoice.status] ?? statusColors.open
              const total = Number(invoice.total_amount) || 0
              const remaining = Number(invoice.remaining_amount) || 0
              const progressPercent = total > 0 ? Math.min(Math.max(((total - remaining) / total) * 100, 0), 100) : 0

              return (
                <TouchableOpacity
                  key={invoice.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Fatura ${invoice.period_display}`}
                  onPress={() => router.push(`/invoices/${invoice.id}`)}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitle}>
                      <Text style={styles.cardTitleText}>{invoice.credit_card_name}</Text>
                      <Text style={styles.cardSubtitleText}>{invoice.period_display}</Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                        <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Total</Text>
                      <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Restante</Text>
                      <Text style={[styles.amountValue, { color: remaining > 0 ? '#fb923c' : '#4ade80' }]}>
                        {formatCurrency(remaining)}
                      </Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Vencimento</Text>
                      <Text style={styles.amountValue}>{shortDate(invoice.due_date)}</Text>
                    </View>
                  </View>

                  {remaining > 0 && total > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{Math.round(progressPercent)}% pago</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
