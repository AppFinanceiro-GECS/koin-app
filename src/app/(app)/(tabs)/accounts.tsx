import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { formatCurrency } from '@/lib/format'
import { accountsApi, creditCardsApi } from '@/services/accounts.api'
import { darkTheme } from '@/theme/colors'

interface AccountItem {
  id: string | number
  name: string
  type: string
  balance: number
  shared?: boolean
}

export default function AccountsScreen() {
  const [activeTab, setActiveTab] = useState<'cards' | 'accounts'>('cards')
  const [selectedAccountId, setSelectedAccountId] = useState<string | number>('itau')

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const cardsQuery = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => (await creditCardsApi.list()).data,
  })

  const refreshing = accountsQuery.isRefetching || cardsQuery.isRefetching
  const onRefresh = () => {
    accountsQuery.refetch()
    cardsQuery.refetch()
  }

  const defaultAccounts: AccountItem[] = [
    { id: 'itau', name: 'Conta Itaú', type: 'Conta corrente', balance: 4200, shared: true },
    { id: 'inter', name: 'Conta Inter', type: 'Conta corrente', balance: 950, shared: false },
  ]

  const accountsList: AccountItem[] =
    accountsQuery.data && accountsQuery.data.length > 0
      ? accountsQuery.data.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type === 'bank' ? 'Conta corrente' : a.type,
          balance: a.balance,
          shared: a.ownership_type === 'household',
        }))
      : defaultAccounts

  const selectedAccount =
    accountsList.find((a) => String(a.id) === String(selectedAccountId)) ?? accountsList[0]

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Contas e cartões</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/transactions')}
          >
            <Feather name="search" size={20} color={darkTheme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => Alert.alert('Notificações', 'Você possui 2 alertas pendentes.')}
          >
            <Feather name="bell" size={20} color={darkTheme.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkTheme.accent}
            colors={[darkTheme.primary]}
          />
        }
      >
        {/* Abas / Filtro: Cartões / Contas */}
        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver Cartões"
            onPress={() => setActiveTab('cards')}
            style={[styles.chip, activeTab === 'cards' ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              style={[
                styles.chipLabel,
                activeTab === 'cards' ? styles.chipLabelActive : styles.chipLabelInactive,
              ]}
            >
              Cartões
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver Contas"
            onPress={() => setActiveTab('accounts')}
            style={[styles.chip, activeTab === 'accounts' ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              style={[
                styles.chipLabel,
                activeTab === 'accounts' ? styles.chipLabelActive : styles.chipLabelInactive,
              ]}
            >
              Contas
            </Text>
          </Pressable>
        </View>

        {activeTab === 'cards' ? (
          /* ======================= ABA CARTÕES ======================= */
          <View style={styles.sectionGap}>
            {/* Cartão Nubank final 4821 */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/credit-card/modal',
                  params: {
                    id: 'nubank',
                    name: 'Nubank',
                    digits: '4821',
                    limit: '8000',
                    closingDay: '24',
                    dueDay: '04',
                  },
                })
              }
              style={({ pressed }) => [pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Nubank final 4821</Text>
                  <Text style={styles.cardSubtitle}>Fecha dia 24, vence dia 04</Text>
                </View>

                {/* Fatura de outubro */}
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceCol}>
                    <Text style={styles.invoiceLabel}>Fatura de outubro</Text>
                    <Text style={styles.statusBadgePurple}>Fechada • vence 04/10</Text>
                  </View>
                  <Text style={styles.invoiceValue}>R$ 2.380,00</Text>
                </View>

                {/* Fatura de novembro */}
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceCol}>
                    <Text style={styles.invoiceLabel}>Fatura de novembro</Text>
                    <Text style={styles.statusBadgeMuted}>Aberta • fecha 24/10</Text>
                  </View>
                  <Text style={styles.invoiceValue}>R$ 1.495,90</Text>
                </View>

                {/* Barra de Limite */}
                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '48.5%' }]} />
                  </View>
                  <Text style={styles.limitText}>
                    Limite disponível: R$ 4.124,10 de R$ 8.000,00
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Cartão Inter final 1190 */}
            <View style={styles.darkCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inter final 1190</Text>
                <Text style={styles.cardSubtitle}>Fecha dia 28, vence dia 07</Text>
              </View>

              <View style={styles.invoiceRow}>
                <View style={styles.invoiceCol}>
                  <Text style={styles.invoiceLabel}>Fatura de outubro</Text>
                  <Text style={styles.statusBadgeYellow}>Estimada • PDF pendente</Text>
                </View>
                <Text style={styles.invoiceValue}>R$ 1.150,40</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar PDF da fatura"
                onPress={() => router.push('/invoice/import' as any)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.actionButtonText}>Enviar PDF da fatura</Text>
              </Pressable>
            </View>

            {/* Resumo de Contas no final da aba Cartões */}
            <View style={styles.accountsGroupCard}>
              {accountsList.map((acc, index) => (
                <View key={String(acc.id)}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    onPress={() => {
                      setSelectedAccountId(acc.id)
                      setActiveTab('accounts')
                    }}
                    style={({ pressed }) => [styles.accountRow, pressed && styles.buttonPressed]}
                  >
                    <View style={styles.accountIconWrapper}>
                      <Feather name="credit-card" size={18} color={darkTheme.accent} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{acc.name}</Text>
                      <Text style={styles.accountType}>{acc.type}</Text>
                    </View>
                    <Text style={styles.accountBalance}>{formatCurrency(acc.balance)}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Botões de Ação */}
            <View style={styles.actionsBottomRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar cartão"
                onPress={() => router.push('/credit-card/modal')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>Adicionar cartão</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar conta"
                onPress={() => router.push('/account/modal')}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>Adicionar conta</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ======================= ABA CONTAS ======================= */
          <View style={styles.sectionGap}>
            {/* Seletor de Contas */}
            {accountsList.map((acc) => {
              const isSelected = String(acc.id) === String(selectedAccount.id)
              return (
                <Pressable
                  key={String(acc.id)}
                  onPress={() => setSelectedAccountId(acc.id)}
                  style={[
                    styles.accountSelectorCard,
                    isSelected
                      ? styles.accountSelectorActive
                      : styles.accountSelectorInactive,
                  ]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountType}>
                      {acc.type} · {formatCurrency(acc.balance)}
                    </Text>
                  </View>
                </Pressable>
              )
            })}

            {/* Cartão de Resumo Gradiente da Conta Selecionada */}
            <LinearGradient
              colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <Text style={styles.cardSubtitle}>
                Saldo registrado · {selectedAccount.name}
              </Text>
              <Text style={styles.bigBalance}>
                {formatCurrency(selectedAccount.balance)}
              </Text>
              <Text style={styles.accountOwner}>
                Pedro Andrade · sem sincronização bancária
              </Text>
            </LinearGradient>

            {/* Informações de Família e Ação de Edição */}
            <View style={styles.darkCard}>
              <View style={styles.badgeWrapper}>
                <View style={styles.familyBadge}>
                  <Text style={styles.familyBadgeText}>
                    Compartilhada · Família Andrade
                  </Text>
                </View>
              </View>

              <Text style={styles.familyDescription}>
                Marina (admin), Pedro e Lucas veem o que foi compartilhado.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${selectedAccount.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/account/modal',
                    params: {
                      id: String(selectedAccount.id),
                      name: selectedAccount.name,
                      balance: String(selectedAccount.balance),
                    },
                  })
                }
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>
                  Editar conta {selectedAccount.name.replace('Conta ', '')}
                </Text>
              </Pressable>
            </View>

            {/* Seção: Últimos registros */}
            <View style={styles.sectionHeaderCol}>
              <Text style={styles.sectionTitle}>Últimos registros</Text>

              <View style={styles.darkCard}>
                {/* Registro 1: Salário */}
                <View style={styles.txRow}>
                  <Text style={styles.txTitle}>Salário · 01/10</Text>
                  <Text style={styles.incomeValue}>+ R$ 6.500,00</Text>
                </View>

                <View style={styles.divider} />

                {/* Registro 2: Aluguel */}
                <View style={styles.txRow}>
                  <View style={styles.accountIconWrapper}>
                    <Feather name="shopping-bag" size={18} color={darkTheme.accent} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.txTitle}>Aluguel</Text>
                    <Text style={styles.txSubtitle}>01/10 · Moradia · Itaú</Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.expenseValue}>R$ 1.400,00</Text>
                    <View style={styles.personalBadge}>
                      <Text style={styles.personalBadgeText}>Registro pessoal</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.consolidatedNote}>
                  Saldo consolidado inclui registros anteriores. Não é um extrato bancário.
                </Text>
              </View>
            </View>

            {/* Botões de Ação na aba Contas */}
            <View style={styles.actionsBottomRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar conta"
                onPress={() => router.push('/account/modal')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>Adicionar conta</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar cartão"
                onPress={() => router.push('/credit-card/modal')}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>Adicionar cartão</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.primary,
    borderWidth: 2,
    borderColor: darkTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: darkTheme.accent,
  },
  chipLabelInactive: {
    color: darkTheme.textSecondary,
  },
  sectionGap: {
    gap: 14,
  },
  cardGradient: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  darkCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  invoiceCol: {
    gap: 3,
  },
  invoiceLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  statusBadgePurple: {
    fontSize: 12,
    color: darkTheme.accent,
    fontWeight: '500',
  },
  statusBadgeMuted: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  statusBadgeYellow: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '500',
  },
  invoiceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  progressSection: {
    gap: 8,
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: darkTheme.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 999,
  },
  limitText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  actionButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  accountsGroupCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  accountIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  accountType: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.border,
  },
  actionsBottomRow: {
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
  accountSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  accountSelectorActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  accountSelectorInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    opacity: 0.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: darkTheme.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: darkTheme.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkTheme.accent,
  },
  bigBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  accountOwner: {
    fontSize: 13,
    color: darkTheme.text,
  },
  badgeWrapper: {
    flexDirection: 'row',
  },
  familyBadge: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  familyBadgeText: {
    fontSize: 12,
    color: darkTheme.accent,
    fontWeight: '500',
  },
  familyDescription: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    lineHeight: 20,
  },
  sectionHeaderCol: {
    gap: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  txSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  incomeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.success,
    marginLeft: 'auto',
  },
  expenseValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'right',
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  personalBadge: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  personalBadgeText: {
    fontSize: 10,
    color: darkTheme.textSecondary,
  },
  consolidatedNote: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
})
