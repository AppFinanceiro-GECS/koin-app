import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
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
    padding: 6,
    borderRadius: 6,
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

export default function InvoicesScreen() {
  const router = useRouter()
  const { creditCardId, creditCardName } = useLocalSearchParams<{
    creditCardId?: string
    creditCardName?: string
  }>()

  const { data: invoices = [], isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{creditCardName ? `Faturas - ${creditCardName}` : 'Faturas'}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>Nenhuma fatura encontrada</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {invoices.map((invoice) => {
              const statusConfig = statusColors[invoice.status]
              const progressPercent = ((invoice.total_amount - invoice.remaining_amount) / invoice.total_amount) * 100

              return (
                <TouchableOpacity
                  key={invoice.id}
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
                      <TouchableOpacity
                        onPress={() => {
                          // TODO: Navigate to edit credit card modal
                        }}
                        style={styles.editButton}
                      >
                        <Ionicons name="pencil" size={16} color="#a855f7" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Total</Text>
                      <Text style={styles.amountValue}>R$ {invoice.total_amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Restante</Text>
                      <Text style={[styles.amountValue, { color: invoice.remaining_amount > 0 ? '#fb923c' : '#4ade80' }]}>
                        R$ {invoice.remaining_amount.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Vencimento</Text>
                      <Text style={styles.amountValue}>
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {invoice.remaining_amount > 0 && (
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
