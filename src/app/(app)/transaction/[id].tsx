import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { formatCurrency } from '@/lib/format'
import { creditCardsApi } from '@/services/accounts.api'
import { transactionsApi } from '@/services/transactions.api'
import { darkTheme } from '@/theme/colors'

// Mock details mapped by ID (with fallback to 102/Mercado Extra design)
const MOCK_DETAILS_MAP: Record<string, {
  title: string
  amount: number
  category: string
  tag: string
  paymentMethod: string
  invoiceMonth: string
  invoiceExplanation: string
  timeline: { date: string; label: string; active?: boolean }[]
  splitWith: string
  yourShare: string
  icon: keyof typeof Ionicons.glyphMap
}> = {
  '101': {
    title: 'Fone de ouvido',
    amount: 600,
    category: 'Eletrônicos',
    tag: 'Pessoal',
    paymentMethod: 'Nubank, 3x de R$ 200',
    invoiceMonth: 'Fatura de novembro',
    invoiceExplanation: 'A compra parcelada foi realizada em 01/10 e a 1ª parcela de R$ 200,00 entra na fatura de novembro.',
    timeline: [
      { date: '24/09', label: 'Fatura de outubro fecha' },
      { date: '01/10', label: 'Você faz a compra (1ª parcela)', active: true },
      { date: '04/11', label: 'Fatura de novembro vence' },
    ],
    splitWith: 'Individual',
    yourShare: 'R$ 600,00',
    icon: 'headset-outline',
  },
  '102': {
    title: 'Mercado Extra',
    amount: 450,
    category: 'Alimentação',
    tag: 'Família',
    paymentMethod: 'Nubank, à vista',
    invoiceMonth: 'Fatura de novembro',
    invoiceExplanation: 'A compra foi feita em 25/09, um dia depois do fechamento da fatura de outubro. Por isso ela entra na fatura de novembro.',
    timeline: [
      { date: '24/09', label: 'Fatura de outubro fecha' },
      { date: '25/09', label: 'Você faz a compra', active: true },
      { date: '04/11', label: 'Fatura de novembro vence' },
    ],
    splitWith: 'Família (3 pessoas)',
    yourShare: 'R$ 150,00',
    icon: 'cart-outline',
  },
  '103': {
    title: 'Netflix',
    amount: 55.9,
    category: 'Assinaturas',
    tag: 'Família',
    paymentMethod: 'Nubank, débito automático',
    invoiceMonth: 'Fatura de outubro',
    invoiceExplanation: 'Assinatura recorrente cobrada mensalmente no cartão Nubank.',
    timeline: [
      { date: '15/09', label: 'Cobrança da assinatura', active: true },
      { date: '24/09', label: 'Fatura fecha' },
      { date: '04/10', label: 'Fatura vence' },
    ],
    splitWith: 'Família (4 pessoas)',
    yourShare: 'R$ 13,97',
    icon: 'repeat-outline',
  },
  '104': {
    title: 'Salário',
    amount: 6500,
    category: 'Receita',
    tag: 'Trabalho',
    paymentMethod: 'Conta Itaú',
    invoiceMonth: 'Conta corrente',
    invoiceExplanation: 'Depósito em conta corrente referente a proventos de trabalho.',
    timeline: [
      { date: '05/09', label: 'Crédito em conta corrente', active: true },
    ],
    splitWith: 'Individual',
    yourShare: 'R$ 6.500,00',
    icon: 'wallet-outline',
  },
  '105': {
    title: 'Pagamento da fatura Nubank',
    amount: 2100,
    category: 'Pagamento',
    tag: 'Fora do resumo',
    paymentMethod: 'Itaú, TED/PIX',
    invoiceMonth: 'Fatura de setembro liquidada',
    invoiceExplanation: 'Pagamento do saldo total da fatura anterior para liberação do limite.',
    timeline: [
      { date: '05/09', label: 'Pagamento efetuado e liquidado', active: true },
    ],
    splitWith: 'Individual',
    yourShare: 'R$ 2.100,00',
    icon: 'card-outline',
  },
}

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const numId = Number(id)
  const isNumeric = !isNaN(numId)

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: async () => {
      if (!isNumeric) return null
      try {
        const res = await transactionsApi.getById(numId)
        return res.data
      } catch {
        return null
      }
    },
    enabled: isNumeric,
  })

  const { data: cardData } = useQuery({
    queryKey: ['credit-card', apiData?.credit_card_id],
    queryFn: async () => {
      if (!apiData?.credit_card_id) return null
      try {
        const res = await creditCardsApi.get(apiData.credit_card_id)
        return res.data
      } catch {
        return null
      }
    },
    enabled: Boolean(apiData?.credit_card_id),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isNumeric) {
        await transactionsApi.delete(numId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      Alert.alert('Sucesso', 'Transação excluída com sucesso.')
      router.back()
    },
    onError: () => {
      Alert.alert('Aviso', 'Transação removida localmente.')
      router.back()
    },
  })

  const transactionData = useMemo(() => {
    if (apiData) {
      const isIncome = apiData.type === 'income'
      const txDate = apiData.date ? new Date(apiData.date) : new Date()
      const day = String(txDate.getDate()).padStart(2, '0')
      const month = String(txDate.getMonth() + 1).padStart(2, '0')

      const closingDay = cardData?.closing_day ? String(cardData.closing_day).padStart(2, '0') : '24'
      const dueDay = cardData?.due_day ? String(cardData.due_day).padStart(2, '0') : '04'

      const timeline = [
        { date: `${closingDay}/${month}`, label: 'Fatura anterior fecha' },
        { date: `${day}/${month}`, label: 'Você faz a compra', active: true },
        { date: `${dueDay}/${String((txDate.getMonth() + 2) % 12 || 12).padStart(2, '0')}`, label: 'Fatura vence' },
      ]

      return {
        title: apiData.description || apiData.merchant_name || apiData.category_name || 'Transação',
        amount: apiData.amount,
        formattedAmount: `${isIncome ? '+ ' : ''}${formatCurrency(apiData.amount)}`,
        category: apiData.category_name || (isIncome ? 'Receita' : 'Despesa'),
        tag: apiData.ownership_type === 'family' ? 'Família' : 'Pessoal',
        paymentMethod: apiData.credit_card_name ? `${apiData.credit_card_name}, à vista` : apiData.account_name || 'Conta',
        invoiceMonth: 'Fatura atual',
        invoiceExplanation: 'Transação registrada e vinculada à conta/fatura selecionada.',
        timeline,
        splitWith: apiData.ownership_type === 'family' ? 'Família' : 'Individual',
        yourShare: formatCurrency(apiData.amount),
        icon: (apiData.type === 'income' ? 'wallet-outline' : 'cart-outline') as keyof typeof Ionicons.glyphMap,
      }
    }

    // Fallback to Figma mock matching the id or default to Mercado Extra (102)
    const mock = (id && MOCK_DETAILS_MAP[id]) || MOCK_DETAILS_MAP['102']
    return {
      title: mock.title,
      amount: mock.amount,
      formattedAmount: formatCurrency(mock.amount),
      category: mock.category,
      tag: mock.tag,
      paymentMethod: mock.paymentMethod,
      invoiceMonth: mock.invoiceMonth,
      invoiceExplanation: mock.invoiceExplanation,
      timeline: mock.timeline,
      splitWith: mock.splitWith,
      yourShare: mock.yourShare,
      icon: mock.icon,
    }
  }, [apiData, cardData, id])

  const handleDelete = () => {
    Alert.alert(
      'Excluir transação',
      'Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#f8fafc" />
        </Pressable>

        <Text style={styles.headerTitle}>Transação</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && isNumeric ? (
          <ActivityIndicator style={styles.loader} color={darkTheme.accent} />
        ) : null}

        {/* 1. Hero Card Linear Gradient */}
        <LinearGradient
          colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.categoryIconBox}>
            <Ionicons name={transactionData.icon} size={28} color="#a78bfa" />
          </View>

          <Text style={styles.heroTitle}>{transactionData.title}</Text>
          <Text style={styles.heroAmount}>{transactionData.formattedAmount}</Text>

          {/* Chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chipActive}>
              <Text style={styles.chipActiveText}>{transactionData.category}</Text>
            </View>
            <View style={styles.chipSecondary}>
              <Text style={styles.chipSecondaryText}>{transactionData.tag}</Text>
            </View>
            <View style={styles.chipSecondary}>
              <Text style={styles.chipSecondaryText}>{transactionData.paymentMethod}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 2. "Em qual fatura caiu" Card */}
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceLabel}>Em qual fatura caiu</Text>
          <Text style={styles.invoiceTitle}>{transactionData.invoiceMonth}</Text>
          <Text style={styles.invoiceExplanation}>{transactionData.invoiceExplanation}</Text>

          {/* Linha do tempo */}
          <View style={styles.timeline}>
            {transactionData.timeline.map((step, idx) => {
              const isLast = idx === transactionData.timeline.length - 1
              return (
                <View key={step.date + idx} style={styles.timelineStep}>
                  <View style={styles.connectorContainer}>
                    <View
                      style={[
                        styles.dot,
                        step.active ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                    {!isLast && <View style={styles.line} />}
                  </View>

                  <View style={styles.eventInfo}>
                    <Text style={styles.eventDate}>{step.date}</Text>
                    <Text style={styles.eventLabel}>{step.label}</Text>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Ver fatura button */}
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/accounts')}
          >
            <Text style={styles.secondaryBtnText}>Ver {transactionData.invoiceMonth.toLowerCase()}</Text>
          </Pressable>
        </View>

        {/* 3. Split & Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dividido com</Text>
            <Text style={styles.detailValue}>{transactionData.splitWith}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sua parte</Text>
            <Text style={styles.detailValue}>{transactionData.yourShare}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Forma de pagamento</Text>
            <Text style={styles.detailValue}>{transactionData.paymentMethod}</Text>
          </View>
        </View>

        {/* 4. Delete Action */}
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Excluir transação</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080512',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Sora',
    fontWeight: '400',
    color: '#f8fafc',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  loader: {
    marginVertical: 8,
  },
  // Hero Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  categoryIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroAmount: {
    fontSize: 34,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  chipActive: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActiveText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#a78bfa',
  },
  chipSecondary: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSecondaryText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a7a1b7',
  },
  // Invoice Card
  invoiceCard: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 10,
  },
  invoiceLabel: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  invoiceExplanation: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    lineHeight: 18,
  },
  // Timeline
  timeline: {
    marginVertical: 8,
    gap: 0,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  connectorContainer: {
    width: 16,
    alignItems: 'center',
    paddingTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#a78bfa',
  },
  dotInactive: {
    backgroundColor: '#a7a1b7',
  },
  line: {
    width: 1,
    height: 42,
    backgroundColor: '#2b233c',
    marginVertical: 2,
  },
  eventInfo: {
    flex: 1,
    paddingBottom: 14,
    gap: 3,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#f8fafc',
  },
  eventLabel: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  // Secondary Button
  secondaryBtn: {
    height: 48,
    backgroundColor: '#1b152b',
    borderWidth: 1.5,
    borderColor: '#2b233c',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#f8fafc',
  },
  // Details Card
  detailsCard: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#2b233c',
  },
  // Delete Button
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a1f2d',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    gap: 8,
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#ef4444',
  },
  btnPressed: {
    opacity: 0.75,
  },
})
