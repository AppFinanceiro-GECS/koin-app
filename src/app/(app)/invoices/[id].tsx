import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { invoiceService } from '@/services/invoiceService'
import { InvoicePaymentModal } from '@/components/invoices/InvoicePaymentModal'
import { InvoiceTransactionList } from '@/components/invoices/InvoiceTransactionList'
import { InvoiceDuplicateWarningBanner } from '@/components/invoices/InvoiceDuplicateWarning'
import { ComingSoonSection } from '@/components/invoices/ComingSoonSection'
import type { InvoiceResponse } from '@/types/invoice'

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
  backButton: {
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  period: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  amountLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  totalAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  smallAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#94a3b8',
  },
  infoValue: {
    color: '#ffffff',
    fontWeight: '600',
  },
  paidButton: {
    backgroundColor: '#9333ea',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  paidButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  paidStatus: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paidStatusText: {
    color: '#22c55e',
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  successMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  errorMessage: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  successText: {
    color: '#22c55e',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  transactionsLabel: {
    fontWeight: '600',
    marginBottom: 16,
  },
})

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoice(parseInt(id!)),
    enabled: !!id,
  })

  const { data: duplicateWarning } = useQuery({
    queryKey: ['invoiceDuplicates', id],
    queryFn: () => invoiceService.getDuplicateWarnings(parseInt(id!)),
    enabled: !!id && !!invoice,
  })

  const handlePaymentSuccess = (updatedInvoice: InvoiceResponse) => {
    setPaymentModalVisible(false)
    setSuccessMessage('Pagamento registrado com sucesso!')
    refetch()
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handlePaymentError = (error: string) => {
    setErrorMessage(error)
    setTimeout(() => setErrorMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    )
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: '#ffffff', textAlign: 'center' }}>Fatura não encontrada</Text>
      </SafeAreaView>
    )
  }

  const isPaid = invoice.status === 'paid'
  const statusColors: Record<string, string> = {
    open: '#60a5fa',
    closed: '#facc15',
    paid: '#4ade80',
    partial: '#fb923c',
    overdue: '#f87171',
  }

  const comingSoonFeatures = [
    {
      icon: 'document-attach',
      title: 'Anexar documentos',
      description: 'Adicione recibos e comprovantes',
    },
    {
      icon: 'chatbox-outline',
      title: 'Comentários',
      description: 'Deixe notas sobre a fatura',
    },
    {
      icon: 'download-outline',
      title: 'Exportar PDF',
      description: 'Baixe a fatura em PDF',
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{invoice.credit_card_name}</Text>
          <Text style={[styles.period, { color: statusColors[invoice.status] }]}>
            {invoice.period_display}
          </Text>
        </View>

        <View style={styles.content}>
          {duplicateWarning && (
            <InvoiceDuplicateWarningBanner warning={duplicateWarning} />
          )}

          <View style={styles.card}>
            <Text style={styles.amountLabel}>Valor total</Text>
            <Text style={styles.totalAmount}>R$ {invoice.total_amount.toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.amountLabel}>Pago</Text>
              <Text style={[styles.smallAmount, { color: '#4ade80' }]}>
                R$ {invoice.paid_amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.halfCard}>
              <Text style={styles.amountLabel}>Restante</Text>
              <Text
                style={[
                  styles.smallAmount,
                  { color: invoice.remaining_amount > 0 ? '#fb923c' : '#4ade80' },
                ]}
              >
                R$ {invoice.remaining_amount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de vencimento</Text>
              <Text style={styles.infoValue}>
                {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de fechamento</Text>
              <Text style={styles.infoValue}>
                {new Date(invoice.closing_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            {invoice.status === 'paid' && invoice.paid_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Data de pagamento</Text>
                <Text style={[styles.infoValue, { color: '#4ade80' }]}>
                  {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
          </View>

          {invoice.transaction_count > 0 && (
            <View style={styles.card}>
              <Text style={[styles.infoValue, styles.transactionsLabel]}>
                Transações ({invoice.transaction_count})
              </Text>
              <InvoiceTransactionList transactions={invoice.transactions || []} />
            </View>
          )}

          {!isPaid && invoice.remaining_amount > 0 && (
            <TouchableOpacity
              onPress={() => setPaymentModalVisible(true)}
              style={styles.paidButton}
            >
              <Text style={styles.paidButtonText}>Registrar Pagamento</Text>
            </TouchableOpacity>
          )}

          {isPaid && (
            <View style={styles.paidStatus}>
              <Text style={styles.paidStatusText}>✓ Fatura paga</Text>
            </View>
          )}

          <ComingSoonSection title="Próximas funcionalidades" items={comingSoonFeatures} />
        </View>

        {successMessage && (
          <View style={[styles.message, styles.successMessage]}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={[styles.message, styles.errorMessage]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>

      <InvoicePaymentModal
        visible={paymentModalVisible}
        invoice={invoice}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </SafeAreaView>
  )
}
