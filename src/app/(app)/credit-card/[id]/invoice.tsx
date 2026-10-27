import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, TextInput, Modal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  monthTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  monthTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  monthTabActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7',
  },
  monthTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  monthTabTextActive: {
    color: '#a855f7',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#60a5fa',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a855f7',
  },
  dueText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8,
  },
  amountCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 8,
  },
  amountLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  amountValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },
  periodText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  paymentButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  transactionsSection: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  transactionTitle: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  transactionDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  transactionAmount: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020617',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  invoiceHeader: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  invoiceHeaderText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  invoiceAmount: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  invoiceDueDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioGroup: {
    gap: 8,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  radioOptionActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: '#a855f7',
    backgroundColor: '#a855f7',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#020617',
    position: 'absolute',
    top: 5,
    left: 5,
  },
  radioLabel: {
    flex: 1,
  },
  radioTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  radioDescription: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16,
  },
  accountBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  accountTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  accountBalance: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  warningBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  noteBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  noteText: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },

  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successCheckmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 32,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowLast: {
    marginBottom: 0,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  successButtonsRow: {
    gap: 12,
    width: '100%',
  },
  successPrimaryButton: {
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successPrimaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  successSecondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successSecondaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
})

const mockInvoiceData = {
  nubank: {
    name: 'Nubank',
    months: ['Set', 'Out', 'Nov', 'Dez'],
    invoices: {
      'Out': {
        status: 'closed',
        dueDate: 'Vence em 04/10, daqui a 3 dias',
        amount: 2380.0,
        period: 'Compras de 25/08 a 24/09',
        transactions: [
          { name: 'Uber', date: '20/09, Transporte', amount: 32.9 },
          { name: 'Notebook', date: '10/08, parcela 2 de 6', amount: 500.0, badge: 'Parcelado' },
          { name: 'Netflix', date: '15/09, Assinaturas', amount: 55.9, badge: 'Recorrente' },
          { name: 'Posto Shell', date: '12/09, Transporte', amount: 210.0 },
          { name: 'Geladeira', date: '05/06, parcela 4 de 10', amount: 290.0, badge: 'Parcelado' },
        ],
      },
    },
  },
  inter: {
    name: 'Inter',
    months: ['Set', 'Out', 'Nov', 'Dez'],
    invoices: {
      'Out': {
        status: 'partial',
        dueDate: 'Vence em 07/11',
        amount: 1150.4,
        period: 'Compras de 28/09 a 28/10',
        transactions: [
          { name: 'Supermercado X', date: '05/10, Alimentação', amount: 450.2 },
          { name: 'Restaurante Y', date: '15/10, Alimentação', amount: 150.0 },
          { name: 'Combustível', date: '20/10, Transporte', amount: 200.0 },
          { name: 'Farmácia', date: '25/10, Saúde', amount: 350.2 },
        ],
      },
    },
  },
}

type PaymentType = 'total' | 'partial' | null
type Screen = 'invoice' | 'payment' | 'success'

export default function CreditCardInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()

  const cardData = mockInvoiceData[id as keyof typeof mockInvoiceData]
  const [selectedMonth, setSelectedMonth] = useState(cardData?.months[1] || 'Out')
  const [screen, setScreen] = useState<Screen>('invoice')
  const [paymentType, setPaymentType] = useState<PaymentType>(null)
  const [customAmount, setCustomAmount] = useState('')

  if (!cardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Fatura não encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  const invoice = cardData.invoices[selectedMonth as keyof typeof cardData.invoices]

  const handlePaymentSuccess = () => {
    setScreen('success')
  }

  if (screen === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCheckmark}>
          <Ionicons name="checkmark" size={40} color="#4ade80" />
        </View>
        <Text style={styles.successTitle}>Pagamento registrado</Text>
        <Text style={styles.successMessage}>
          R$ 2.380,00 registrados. Fatura de outubro quitada no controle do app.
        </Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Origem</Text>
            <Text style={styles.summaryValue}>Conta Itaú · saldo R$ 1.820,00</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Text style={styles.summaryLabel}>Resumo de despesas</Text>
            <Text style={styles.summaryValue}>Não muda</Text>
          </View>
        </View>
        <View style={styles.successButtonsRow}>
          <TouchableOpacity style={styles.successPrimaryButton} onPress={() => setScreen('invoice')}>
            <Text style={styles.successPrimaryButtonText}>Ver fatura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successSecondaryButton} onPress={() => router.push('/(tabs)' as any)}>
            <Text style={styles.successSecondaryButtonText}>Ir para início</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (screen === 'payment') {
    return (
      <Modal visible transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={() => setScreen('invoice')}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Registrar pagamento</Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceHeaderText}>{cardData.name}, fatura de {selectedMonth}</Text>
                <Text style={styles.invoiceAmount}>R$ {invoice.amount.toFixed(2)}</Text>
                <Text style={styles.invoiceDueDate}>{invoice.dueDate}</Text>
              </View>

              <Text style={styles.sectionTitle}>Valor pago</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, paymentType === 'total' && styles.radioOptionActive]}
                  onPress={() => setPaymentType('total')}
                >
                  <View style={[styles.radioCircle, paymentType === 'total' && styles.radioCircleActive]}>
                    {paymentType === 'total' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioTitle}>Valor total</Text>
                    <Text style={styles.radioDescription}>R$ {invoice.amount.toFixed(2)}. Registra o total pago.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.radioOption, paymentType === 'partial' && styles.radioOptionActive]}
                  onPress={() => setPaymentType('partial')}
                >
                  <View style={[styles.radioCircle, paymentType === 'partial' && styles.radioCircleActive]}>
                    {paymentType === 'partial' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioTitle}>Valor parcial</Text>
                    <Text style={styles.radioDescription}>O restante rola para a próxima fatura.</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {paymentType === 'partial' && (
                <>
                  <Text style={styles.inputLabel}>Valor pago</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="R$ 1.000,00"
                    placeholderTextColor="#3f3f46"
                    value={customAmount}
                    onChangeText={setCustomAmount}
                  />
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={16} color="#fbbf24" />
                    <Text style={styles.warningText}>R$ 1.380,00 vão para a fatura de novembro. Podem incluir juros e IOF do rotativo.</Text>
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Conta de origem</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioOption, styles.radioOptionActive]}>
                  <View style={[styles.radioCircle, styles.radioCircleActive]}>
                    <View style={styles.radioInner} />
                  </View>
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioTitle}>Conta Itaú</Text>
                    <Text style={styles.radioDescription}>Saldo R$ 4.200,00 · liquidez permitida</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.radioOption}>
                  <View style={styles.radioCircle} />
                  <View style={styles.radioLabel}>
                    <Text style={styles.radioTitle}>Conta Inter</Text>
                    <Text style={styles.radioDescription}>Saldo R$ 950,00, insuficiente</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={16} color="#64748b" />
                <Text style={styles.noteText}>Registro apenas: pague no banco. Fora das despesas.</Text>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handlePaymentSuccess}>
                <Text style={styles.submitButtonText}>
                  {paymentType === 'total' ? `Registrar R$ ${invoice.amount.toFixed(2)}` : `Registrar R$ ${customAmount || '1.000,00'}`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Fatura {cardData.name}</Text>
        </View>

        <View style={styles.monthTabs}>
          {cardData.months.map((month) => (
            <TouchableOpacity
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={[
                styles.monthTab,
                selectedMonth === month && styles.monthTabActive,
              ]}
            >
              <Text
                style={[
                  styles.monthTabText,
                  selectedMonth === month && styles.monthTabTextActive,
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {invoice && (
          <View style={styles.content}>
            <View>
              <View style={[styles.statusBadge, invoice.status === 'closed' ? styles.statusBadgeClosed : styles.statusBadgeOpen]}>
                <Text style={styles.statusBadgeText}>{invoice.status === 'closed' ? 'Fechada' : 'Aberta'}</Text>
              </View>
              <Text style={styles.dueText}>{invoice.dueDate}</Text>
            </View>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Valor total</Text>
              <Text style={styles.amountValue}>R$ {invoice.amount.toFixed(2)}</Text>
              <Text style={styles.periodText}>{invoice.period}</Text>
            </View>

            <TouchableOpacity style={styles.paymentButton} onPress={() => setScreen('payment')}>
              <Text style={styles.paymentButtonText}>Registrar pagamento</Text>
            </TouchableOpacity>

            {invoice.transactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <Text style={styles.transactionTitle}>Lançamentos ({invoice.transactions.length})</Text>
                {invoice.transactions.map((transaction, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.transactionItem,
                      idx === invoice.transactions.length - 1 && styles.transactionItemLast,
                    ]}
                  >
                    <View style={styles.transactionIcon}>
                      <Ionicons name="receipt" size={20} color="#a855f7" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{transaction.name}</Text>
                      <Text style={styles.transactionDate}>{transaction.date}</Text>
                      {(transaction as any).badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{(transaction as any).badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.transactionAmount}>R$ {transaction.amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
