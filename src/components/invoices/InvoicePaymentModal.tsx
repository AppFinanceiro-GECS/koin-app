import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { invoiceService } from '@/services/invoiceService'
import type { InvoiceResponse } from '@/types/invoice'

interface Account {
  id: number
  name: string
  balance?: number
}

interface InvoicePaymentModalProps {
  visible: boolean
  invoice: InvoiceResponse | null
  onClose: () => void
  onSuccess: (invoice: InvoiceResponse) => void
  onError: (error: string) => void
}

export function InvoicePaymentModal({
  visible,
  invoice,
  onClose,
  onSuccess,
  onError,
}: InvoicePaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState<string>('')
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [paymentDate, setPaymentDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const mockAccounts: Account[] = [
    { id: 1, name: 'Conta Principal', balance: 5000 },
    { id: 2, name: 'Conta Poupança', balance: 2500 },
  ]

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => mockAccounts,
    enabled: visible,
  })

  const handlePayment = async () => {
    if (!invoice || !selectedAccountId) {
      onError('Selecione a conta de origem')
      return
    }

    const paymentAmount = paymentType === 'full' ? invoice.remaining_amount : parseFloat(amount)

    if (paymentAmount <= 0 || paymentAmount > invoice.remaining_amount) {
      onError('Valor inválido')
      return
    }

    setLoading(true)
    try {
      const result = await invoiceService.payInvoice(invoice.id, {
        amount: paymentAmount,
        payment_account_id: selectedAccountId,
        payment_date: paymentDate.toISOString().split('T')[0],
        payment_method: 'bank_transfer',
      })
      onSuccess(result)
      onClose()
    } catch {
      onError('Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (!invoice) return null

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-slate-950 rounded-t-3xl p-6 pb-8">
          <Text className="text-white text-xl font-bold mb-4">Registrar Pagamento</Text>

          <View className="bg-slate-900 rounded-lg p-4 mb-6">
            <Text className="text-slate-400 text-sm">Valor da fatura</Text>
            <Text className="text-white text-2xl font-bold">R$ {invoice.remaining_amount.toFixed(2)}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Tipo de pagamento</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPaymentType('full')}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  paymentType === 'full'
                    ? 'bg-purple-600 border-purple-500'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <Text className={`text-center font-semibold ${paymentType === 'full' ? 'text-white' : 'text-slate-400'}`}>
                  Total
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentType('partial')}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  paymentType === 'partial'
                    ? 'bg-purple-600 border-purple-500'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${paymentType === 'partial' ? 'text-white' : 'text-slate-400'}`}
                >
                  Parcial
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {paymentType === 'partial' && (
            <View className="mb-6">
              <Text className="text-white font-semibold mb-2">Valor do pagamento</Text>
              <TextInput
                className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700"
                placeholder="0,00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          )}

          <View className="mb-6">
            <Text className="text-white font-semibold mb-2">Conta de origem</Text>
            <View className="bg-slate-900 rounded-lg border border-slate-700">
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  className={`p-3 border-b border-slate-700 flex-row items-center justify-between ${
                    selectedAccountId === account.id ? 'bg-purple-900' : ''
                  }`}
                >
                  <View>
                    <Text className="text-white font-semibold">{account.name}</Text>
                    <Text className="text-slate-400 text-sm">R$ {account.balance?.toFixed(2)}</Text>
                  </View>
                  {selectedAccountId === account.id && <Text className="text-purple-400">✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-white font-semibold mb-2">Data do pagamento</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              className="bg-slate-900 p-3 rounded-lg border border-slate-700"
            >
              <Text className="text-white">{paymentDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 p-3 rounded-lg bg-slate-800"
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePayment}
              className="flex-1 p-3 rounded-lg bg-purple-600"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold">Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
