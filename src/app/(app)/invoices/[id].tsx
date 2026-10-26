import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { invoiceService } from '@/services/invoiceService'
import { InvoicePaymentModal } from '@/components/invoices/InvoicePaymentModal'
import { InvoiceTransactionList } from '@/components/invoices/InvoiceTransactionList'
import { InvoiceDuplicateWarningBanner } from '@/components/invoices/InvoiceDuplicateWarning'
import { ComingSoonSection } from '@/components/invoices/ComingSoonSection'
import type { InvoiceResponse } from '@/types/invoice'

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
      <SafeAreaView className="flex-1 bg-slate-950 justify-center">
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    )
  }

  if (!invoice) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center">
        <Text className="text-white text-center">Fatura não encontrada</Text>
      </SafeAreaView>
    )
  }

  const isPaid = invoice.status === 'paid'
  const statusColors = {
    open: 'text-blue-400',
    closed: 'text-yellow-400',
    paid: 'text-green-400',
    partial: 'text-orange-400',
    overdue: 'text-red-400',
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1">
        <View className="p-4 border-b border-slate-800">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">{invoice.credit_card_name}</Text>
          <Text className={`text-lg font-semibold ${statusColors[invoice.status]}`}>
            {invoice.period_display}
          </Text>
        </View>

        <View className="p-4 space-y-4">
          {duplicateWarning && (
            <InvoiceDuplicateWarningBanner warning={duplicateWarning} />
          )}

          <View className="bg-slate-900 rounded-lg p-4">
            <Text className="text-slate-400 text-sm">Valor total</Text>
            <Text className="text-white text-3xl font-bold">R$ {invoice.total_amount.toFixed(2)}</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-slate-900 rounded-lg p-4">
              <Text className="text-slate-400 text-sm">Pago</Text>
              <Text className="text-green-400 text-xl font-bold">R$ {invoice.paid_amount.toFixed(2)}</Text>
            </View>
            <View className="flex-1 bg-slate-900 rounded-lg p-4">
              <Text className="text-slate-400 text-sm">Restante</Text>
              <Text className={`text-xl font-bold ${invoice.remaining_amount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                R$ {invoice.remaining_amount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="bg-slate-900 rounded-lg p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Data de vencimento</Text>
              <Text className="text-white font-semibold">{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Data de fechamento</Text>
              <Text className="text-white font-semibold">
                {new Date(invoice.closing_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            {invoice.status === 'paid' && invoice.paid_at && (
              <View className="flex-row justify-between">
                <Text className="text-slate-400">Data de pagamento</Text>
                <Text className="text-green-400 font-semibold">{new Date(invoice.paid_at).toLocaleDateString('pt-BR')}</Text>
              </View>
            )}
          </View>

          {invoice.transaction_count > 0 && (
            <View className="bg-slate-900 rounded-lg p-4">
              <Text className="text-white font-semibold mb-4">Transações ({invoice.transaction_count})</Text>
              <InvoiceTransactionList transactions={invoice.transactions || []} />
            </View>
          )}

          {!isPaid && invoice.remaining_amount > 0 && (
            <TouchableOpacity
              onPress={() => setPaymentModalVisible(true)}
              className="bg-purple-600 rounded-lg p-4 mt-4"
            >
              <Text className="text-white text-center font-bold text-lg">Registrar Pagamento</Text>
            </TouchableOpacity>
          )}

          {isPaid && (
            <View className="bg-green-900/30 border border-green-600 rounded-lg p-4">
              <Text className="text-green-400 text-center font-semibold">✓ Fatura paga</Text>
            </View>
          )}

          <ComingSoonSection title="Próximas funcionalidades" items={comingSoonFeatures} />
        </View>

        {successMessage && (
          <View className="m-4 bg-green-900/30 border border-green-600 rounded-lg p-3">
            <Text className="text-green-400 text-center">{successMessage}</Text>
          </View>
        )}

        {errorMessage && (
          <View className="m-4 bg-red-900/30 border border-red-600 rounded-lg p-3">
            <Text className="text-red-400 text-center">{errorMessage}</Text>
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
