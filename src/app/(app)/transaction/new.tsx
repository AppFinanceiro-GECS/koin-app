import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, parseAmount, toISODate } from '@/lib/format'
import { accountsApi, creditCardsApi } from '@/services/accounts.api'
import { categoriesApi, transactionsApi } from '@/services/transactions.api'
import { darkTheme } from '@/theme/colors'
import type { PaymentMethod, TransactionCreate } from '@/types/api'

type TransactionKind = 'expense' | 'income' | 'transfer'

const DEFAULT_EXPENSE_CATEGORIES = [
  'Eletrônicos',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
]

const DEFAULT_INCOME_CATEGORIES = [
  'Salário',
  'Investimento',
  'Benefício',
  'Outros',
]

export default function NewTransactionScreen() {
  const queryClient = useQueryClient()

  const [kind, setKind] = useState<TransactionKind>('expense')
  const [amount, setAmount] = useState('600')
  const [description, setDescription] = useState('Fone de ouvido')
  const [selectedCategoryName, setSelectedCategoryName] = useState('Eletrônicos')
  const [date, setDate] = useState(toISODate(new Date()))

  // ID / Seleções dinâmicas
  const [selectedPaymentKey, setSelectedPaymentKey] = useState<string>('')
  const [selectedIncomeAccountId, setSelectedIncomeAccountId] = useState<number | null>(null)
  const [selectedOriginAccountId, setSelectedOriginAccountId] = useState<number | null>(null)
  const [selectedDestAccountId, setSelectedDestAccountId] = useState<number | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const cardsQuery = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => (await creditCardsApi.list()).data,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoriesApi.list()).data,
  })

  // Montar opções dinâmicas de pagamento para Despesa
  const paymentOptions = useMemo(() => {
    const list: {
      key: string
      label: string
      type: 'card' | 'account' | 'cash'
      id?: number
    }[] = []

    if (cardsQuery.data && cardsQuery.data.length > 0) {
      cardsQuery.data.forEach((c: { id: number; name?: string; brand?: string; last_digits?: string }) => {
        list.push({
          key: `card-${c.id}`,
          label: c.name || `Cartão ${c.brand || ''} ••${c.last_digits || ''}`,
          type: 'card',
          id: c.id,
        })
      })
    } else {
      list.push({ key: 'card-nubank', label: 'Cartão Nubank', type: 'card' })
      list.push({ key: 'card-inter', label: 'Cartão Inter', type: 'card' })
    }

    if (accountsQuery.data && accountsQuery.data.length > 0) {
      accountsQuery.data.forEach((a) => {
        list.push({
          key: `acc-${a.id}`,
          label: a.name,
          type: 'account',
          id: a.id,
        })
      })
    } else {
      list.push({ key: 'acc-itau', label: 'Conta Itaú', type: 'account' })
    }

    list.push({ key: 'cash', label: 'Dinheiro', type: 'cash' })
    return list
  }, [cardsQuery.data, accountsQuery.data])

  // Chave ativa de pagamento
  const activePaymentKey = selectedPaymentKey || paymentOptions[0]?.key || ''

  // Contas disponíveis
  const availableAccounts = useMemo(() => {
    if (accountsQuery.data && accountsQuery.data.length > 0) {
      return accountsQuery.data
    }
    return [
      { id: 1, name: 'Conta Itaú • Conta corrente' },
      { id: 2, name: 'Conta Inter' },
      { id: 3, name: 'Carteira' },
    ]
  }, [accountsQuery.data])

  const mutation = useMutation({
    mutationFn: (payload: TransactionCreate) => transactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      router.back()
    },
    onError: (err) => {
      Alert.alert('Erro', getApiErrorMessage(err, 'Não foi possível salvar a transação.'))
    },
  })

  const handleKindChange = (next: TransactionKind) => {
    setKind(next)
    if (next === 'expense') {
      setAmount('600')
      setDescription('Fone de ouvido')
      setSelectedCategoryName('Eletrônicos')
    } else if (next === 'income') {
      setAmount('6500')
      setDescription('Salário')
      setSelectedCategoryName('Salário')
    } else {
      setAmount('500')
      setDescription('Transferência entre contas')
    }
  }

  const handleSave = () => {
    const val = parseAmount(amount)
    if (!(val > 0)) {
      Alert.alert('Aviso', 'Informe um valor válido maior que zero.')
      return
    }

    const firstAccountId = accountsQuery.data?.[0]?.id ?? 1
    const matchingCat = categoriesQuery.data?.find((c) => c.name === selectedCategoryName)?.id

    let accountId = firstAccountId
    let creditCardId: number | undefined
    let paymentMethod: PaymentMethod = 'pix'

    if (kind === 'expense') {
      const selectedOpt = paymentOptions.find((p) => p.key === activePaymentKey)
      if (selectedOpt?.type === 'card') {
        creditCardId = selectedOpt.id
        paymentMethod = 'credit_card'
      } else if (selectedOpt?.type === 'account' && selectedOpt.id) {
        accountId = selectedOpt.id
        paymentMethod = 'pix'
      } else if (selectedOpt?.type === 'cash') {
        paymentMethod = 'cash'
      }
    } else if (kind === 'income') {
      accountId = selectedIncomeAccountId || availableAccounts[0]?.id || firstAccountId
      paymentMethod = 'bank_transfer'
    } else if (kind === 'transfer') {
      accountId = selectedOriginAccountId || availableAccounts[0]?.id || firstAccountId
    }

    const destAccountId =
      kind === 'transfer'
        ? selectedDestAccountId ||
          availableAccounts.find((a) => a.id !== accountId)?.id ||
          availableAccounts[1]?.id
        : undefined

    mutation.mutate({
      type: kind === 'transfer' ? 'transfer' : kind,
      amount: val,
      date,
      account_id: accountId,
      destination_account_id: destAccountId,
      credit_card_id: creditCardId,
      category_id: matchingCat ?? null,
      description: description.trim() || undefined,
      payment_method: paymentMethod,
    })
  }

  const parsedVal = parseAmount(amount)
  const displayVal = isNaN(parsedVal) ? 0 : parsedVal

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Feather name="x" size={22} color={darkTheme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Nova transação</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented Chips: Despesa / Receita / Transferência */}
          <View style={styles.segmentedRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Despesa"
              onPress={() => handleKindChange('expense')}
              style={[
                styles.segmentedChip,
                kind === 'expense' ? styles.segmentedChipActive : styles.segmentedChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.segmentedLabel,
                  kind === 'expense' ? styles.segmentedLabelActive : styles.segmentedLabelInactive,
                ]}
              >
                Despesa
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Receita"
              onPress={() => handleKindChange('income')}
              style={[
                styles.segmentedChip,
                kind === 'income' ? styles.segmentedChipActive : styles.segmentedChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.segmentedLabel,
                  kind === 'income' ? styles.segmentedLabelActive : styles.segmentedLabelInactive,
                ]}
              >
                Receita
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Transferência"
              onPress={() => handleKindChange('transfer')}
              style={[
                styles.segmentedChip,
                kind === 'transfer' ? styles.segmentedChipActive : styles.segmentedChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.segmentedLabel,
                  kind === 'transfer' ? styles.segmentedLabelActive : styles.segmentedLabelInactive,
                ]}
              >
                Transferência
              </Text>
            </Pressable>
          </View>

          {/* Campo Valor */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {kind === 'expense'
                ? 'Valor'
                : kind === 'income'
                ? 'Valor a registrar'
                : 'Valor do registro'}
            </Text>
            {kind === 'income' && (
              <Text style={styles.fieldSubtitle}>Salário · registro manual</Text>
            )}
            {kind === 'transfer' && (
              <Text style={styles.fieldSubtitle}>
                Entre suas contas · não é uma operação bancária
              </Text>
            )}

            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={darkTheme.textMuted}
              />
            </View>
            <Text style={styles.amountPreview}>{formatCurrency(displayVal)}</Text>
          </View>

          {/* Campos específicos de Despesa */}
          {kind === 'expense' && (
            <>
              {/* Descrição */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex: Fone de ouvido, Almoço..."
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>

              {/* Categoria */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Categoria</Text>
                <View style={styles.chipsRow}>
                  {DEFAULT_EXPENSE_CATEGORIES.map((cat) => {
                    const active = selectedCategoryName === cat
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setSelectedCategoryName(cat)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Pagar com */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Pagar com</Text>
                <View style={styles.chipsRow}>
                  {paymentOptions.map((opt) => {
                    const active = activePaymentKey === opt.key
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setSelectedPaymentKey(opt.key)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </>
          )}

          {/* Campos específicos de Receita */}
          {kind === 'income' && (
            <>
              {/* Descrição */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex: Salário, Rendimento..."
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>

              {/* Conta de destino */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Conta de destino</Text>
                <View style={styles.chipsRow}>
                  {availableAccounts.map((acc) => {
                    const active =
                      (selectedIncomeAccountId ?? availableAccounts[0]?.id) === acc.id
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => setSelectedIncomeAccountId(acc.id)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Categoria */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Categoria</Text>
                <View style={styles.chipsRow}>
                  {DEFAULT_INCOME_CATEGORIES.map((cat) => {
                    const active = selectedCategoryName === cat
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setSelectedCategoryName(cat)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </>
          )}

          {/* Campos específicos de Transferência */}
          {kind === 'transfer' && (
            <>
              {/* Origem */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Origem</Text>
                <View style={styles.chipsRow}>
                  {availableAccounts.map((acc) => {
                    const active =
                      (selectedOriginAccountId ?? availableAccounts[0]?.id) === acc.id
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => setSelectedOriginAccountId(acc.id)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Destino */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Destino</Text>
                <View style={styles.chipsRow}>
                  {availableAccounts.map((acc) => {
                    const defaultDestId =
                      availableAccounts.find(
                        (a) => a.id !== (selectedOriginAccountId ?? availableAccounts[0]?.id)
                      )?.id ?? availableAccounts[1]?.id
                    const active = (selectedDestAccountId ?? defaultDestId) === acc.id
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => setSelectedDestAccountId(acc.id)}
                        style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            active ? styles.chipLabelActive : styles.chipLabelInactive,
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </>
          )}

          {/* Data */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>
        </ScrollView>

        {/* Rodapé com botão de ação */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              kind === 'expense'
                ? 'Salvar despesa'
                : kind === 'income'
                ? 'Salvar receita'
                : 'Salvar Transferência'
            }
            onPress={handleSave}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              mutation.isPending && styles.buttonDisabled,
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={darkTheme.background} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {kind === 'expense'
                  ? 'Salvar despesa'
                  : kind === 'income'
                  ? 'Salvar receita'
                  : 'Salvar Transferência'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  headerSpacer: {
    width: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedChip: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  segmentedChipInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  segmentedLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentedLabelActive: {
    color: darkTheme.accent,
    fontWeight: '600',
  },
  segmentedLabelInactive: {
    color: darkTheme.textSecondary,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.textSecondary,
  },
  fieldSubtitle: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
  },
  amountPreview: {
    fontSize: 12,
    color: darkTheme.textMuted,
    paddingTop: 2,
  },
  input: {
    height: 48,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: darkTheme.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  chipInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipLabelActive: {
    color: darkTheme.accent,
    fontWeight: '600',
  },
  chipLabelInactive: {
    color: darkTheme.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    backgroundColor: darkTheme.background,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
})
