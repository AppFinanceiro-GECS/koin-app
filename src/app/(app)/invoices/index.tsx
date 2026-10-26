import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { invoiceService } from '@/services/invoiceService'
import type { InvoiceResponse } from '@/types/invoice'

export default function InvoicesScreen() {
  const router = useRouter()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceService.listInvoices(undefined, undefined, 50),
  })

  const statusColors = {
    open: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Aberta' },
    closed: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Fechada' },
    paid: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Paga' },
    partial: { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'Parcial' },
    overdue: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Vencida' },
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center">
        <ActivityIndicator size="large" color="#a855f7" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="p-4 border-b border-slate-800">
        <Text className="text-white text-2xl font-bold">Faturas</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {invoices.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="document-outline" size={48} color="#64748b" />
            <Text className="text-slate-400 text-center mt-4">Nenhuma fatura encontrada</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {invoices.map((invoice) => {
              const statusConfig = statusColors[invoice.status]
              return (
                <TouchableOpacity
                  key={invoice.id}
                  onPress={() => router.push(`/invoices/${invoice.id}`)}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-800"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">{invoice.credit_card_name}</Text>
                      <Text className="text-slate-400 text-sm">{invoice.period_display}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                      <Text className={`text-xs font-semibold ${statusConfig.text}`}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-end">
                    <View>
                      <Text className="text-slate-400 text-xs">Total</Text>
                      <Text className="text-white font-bold">R$ {invoice.total_amount.toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-xs">Restante</Text>
                      <Text
                        className={`font-bold ${invoice.remaining_amount > 0 ? 'text-orange-400' : 'text-green-400'}`}
                      >
                        R$ {invoice.remaining_amount.toFixed(2)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-xs">Vencimento</Text>
                      <Text className="text-white font-semibold">
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {invoice.remaining_amount > 0 && (
                    <View className="mt-3 bg-slate-800 rounded p-2">
                      <View className="h-1.5 bg-slate-700 rounded overflow-hidden">
                        <View
                          className="h-full bg-purple-600"
                          style={{
                            width: `${((invoice.total_amount - invoice.remaining_amount) / invoice.total_amount) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-400 text-xs mt-1">
                        {Math.round(((invoice.total_amount - invoice.remaining_amount) / invoice.total_amount) * 100)}% pago
                      </Text>
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
