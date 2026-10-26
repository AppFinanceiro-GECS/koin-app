import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native'
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#020617',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  amountBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  amountLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  amountValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  paymentTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#9333ea',
    borderColor: '#a855f7',
  },
  typeButtonInactive: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
  },
  typeButtonText: {
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  typeButtonTextInactive: {
    color: '#94a3b8',
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  accountsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  accountItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountItemActive: {
    backgroundColor: '#5b21b6',
  },
  accountName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  accountBalance: {
    color: '#94a3b8',
    fontSize: 14,
  },
  checkmark: {
    color: '#a78bfa',
  },
  dateButton: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dateText: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#9333ea',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
})

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
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Registrar Pagamento</Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Valor da fatura</Text>
            <Text style={styles.amountValue}>R$ {invoice.remaining_amount.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentTypeSection}>
            <Text style={styles.sectionTitle}>Tipo de pagamento</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setPaymentType('full')}
                style={[
                  styles.typeButton,
                  paymentType === 'full' ? styles.typeButtonActive : styles.typeButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    paymentType === 'full' ? styles.typeButtonTextActive : styles.typeButtonTextInactive,
                  ]}
                >
                  Total
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentType('partial')}
                style={[
                  styles.typeButton,
                  paymentType === 'partial' ? styles.typeButtonActive : styles.typeButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    paymentType === 'partial' ? styles.typeButtonTextActive : styles.typeButtonTextInactive,
                  ]}
                >
                  Parcial
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {paymentType === 'partial' && (
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Valor do pagamento</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          )}

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Conta de origem</Text>
            <View style={styles.accountsBox}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  style={[
                    styles.accountItem,
                    selectedAccountId === account.id && styles.accountItemActive,
                  ]}
                >
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountBalance}>R$ {account.balance?.toFixed(2)}</Text>
                  </View>
                  {selectedAccountId === account.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Data do pagamento</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              style={styles.dateButton}
            >
              <Text style={styles.dateText}>{paymentDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} disabled={loading}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePayment} style={styles.confirmButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
