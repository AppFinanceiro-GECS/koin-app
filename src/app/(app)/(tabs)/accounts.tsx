import Feather from '@expo/vector-icons/Feather'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useState } from 'react'
import {
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
import { notificationsApi } from '@/services/settings.api'
import { transactionsApi } from '@/services/transactions.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface AccountItem {
  id: string | number
  name: string
  type: string
  balance: number
  shared?: boolean
}

export default function AccountsScreen() {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<'cards' | 'accounts'>('cards')
  const [selectedAccountId, setSelectedAccountId] = useState<string | number | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const cardsQuery = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => (await creditCardsApi.list()).data,
  })

  const accountsList: AccountItem[] =
    accountsQuery.data && accountsQuery.data.length > 0
      ? accountsQuery.data.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type === 'bank' ? 'Conta corrente' : a.type === 'wallet' ? 'Carteira' : a.type,
          balance: Number(a.balance) || 0,
          shared: a.ownership_type === 'household',
        }))
      : []

  const selectedAccount =
    accountsList.find((a) => String(a.id) === String(selectedAccountId)) ?? accountsList[0]

  const accountTxQuery = useQuery({
    queryKey: ['transactions', 'account', selectedAccount?.id],
    queryFn: async () => {
      if (!selectedAccount?.id) return []
      const res = await transactionsApi.list({ account_id: Number(selectedAccount.id), limit: 5 })
      return res.data.items || []
    },
    enabled: Boolean(selectedAccount?.id),
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data,
  })
  const unreadCount = notificationsQuery.data?.unread_count ?? 0

  const refreshing =
    accountsQuery.isRefetching ||
    cardsQuery.isRefetching ||
    accountTxQuery.isRefetching ||
    notificationsQuery.isRefetching
  const onRefresh = () => {
    accountsQuery.refetch()
    cardsQuery.refetch()
    accountTxQuery.refetch()
    notificationsQuery.refetch()
  }

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
            onPress={() => router.push('/notifications')}
          >
            <Feather name="bell" size={20} color={darkTheme.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
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
            {/* Lista de Cartões (Reais da API ou Fallback do Figma) */}
            {cardsQuery.data && cardsQuery.data.length > 0 ? (
              cardsQuery.data.map((card: any, idx: number) => {
                const title = card.nickname || card.account_name || `Cartão final ${card.last_four_digits || ''}`
                const subtitle = `Fecha dia ${card.closing_day || 24}, vence dia ${card.due_day || '04'}`
                const limit = Number(card.credit_limit) || 8000
                const balance = Math.abs(Number(card.account_balance) || 0)
                const available = Math.max(limit - balance, 0)
                const percentage = limit > 0 ? Math.min((balance / limit) * 100, 100) : 50

                return (
                  <Pressable
                    key={String(card.id)}
                    onPress={() =>
                      router.push({
                        pathname: '/invoices',
                        params: { creditCardId: String(card.id), creditCardName: card.name },
                      } as any)
                    }
                    style={({ pressed }) => [pressed && styles.buttonPressed, { marginBottom: 14 }]}
                  >
                    <LinearGradient
                      colors={idx === 0 ? ['#0f0b1e', '#1f0c3b', '#0a0414'] : ['#120e1e', '#120e1e']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={idx === 0 ? styles.cardGradient : styles.darkCard}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{title}</Text>
                          <Text style={styles.cardSubtitle}>{subtitle}</Text>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation()
                            router.push(`/credit-card/modal?id=${card.id}` as any)
                          }}
                          style={styles.editButton}
                        >
                          <Ionicons name="pencil" size={16} color="#a855f7" />
                        </Pressable>
                      </View>

                      <View style={styles.invoiceRow}>
                        <View style={styles.invoiceCol}>
                          <Text style={styles.invoiceLabel}>Fatura atual</Text>
                          <Text style={styles.statusBadgePurple}>Em aberto</Text>
                        </View>
                        <Text style={styles.invoiceValue}>{formatCurrency(balance)}</Text>
                      </View>

                      {/* Barra de Limite */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.limitText}>
                          Limite disponível: {formatCurrency(available)} de {formatCurrency(limit)}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                )
              })
            ) : (
              <View style={styles.emptyCardBox}>
                <Feather name="credit-card" size={32} color={darkTheme.textSecondary} />
                <Text style={styles.emptyCardTitle}>Nenhum cartão cadastrado</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Cadastre seus cartões de crédito para acompanhar limites, fechamentos e faturas.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/credit-card/modal')}
                  style={({ pressed }) => [styles.emptyAddButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.emptyAddButtonText}>Cadastrar novo cartão</Text>
                </Pressable>
              </View>
            )}

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
            {accountsList.length === 0 ? (
              <View style={styles.emptyCardBox}>
                <Feather name="credit-card" size={32} color={darkTheme.textSecondary} />
                <Text style={styles.emptyCardTitle}>Nenhuma conta cadastrada</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Cadastre contas bancárias ou carteiras para acompanhar seus saldos e movimentações.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/account/modal')}
                  style={({ pressed }) => [styles.emptyAddButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.emptyAddButtonText}>Cadastrar nova conta</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Seletor de Contas */}
                {accountsList.map((acc) => {
                  const isSelected = selectedAccount && String(acc.id) === String(selectedAccount.id)
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

                {selectedAccount && (
                  <>
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
                        {user?.name || 'Você'} · sem sincronização bancária
                      </Text>
                    </LinearGradient>

                    {/* Informações de Família e Ação de Edição */}
                    <View style={styles.darkCard}>
                      <View style={styles.badgeWrapper}>
                        <View style={styles.familyBadge}>
                          <Text style={styles.familyBadgeText}>
                            {selectedAccount.shared ? 'Conta Compartilhada · Família' : 'Conta Individual · Pessoal'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.familyDescription}>
                        {selectedAccount.shared
                          ? 'Transações desta conta são compartilhadas com o grupo familiar.'
                          : 'Apenas você visualiza as transações vinculadas a esta conta.'}
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

                    {/* Seção: Últimos registros da conta selecionada */}
                    <View style={styles.sectionHeaderCol}>
                      <Text style={styles.sectionTitle}>Últimos registros</Text>

                      <View style={styles.darkCard}>
                        {accountTxQuery.data && accountTxQuery.data.length > 0 ? (
                          accountTxQuery.data.map((tx: any, idx: number) => {
                            const isIncome = tx.type === 'income'
                            const sign = isIncome ? '+ ' : '– '
                            return (
                              <View key={String(tx.id)}>
                                {idx > 0 && <View style={styles.divider} />}
                                <View style={styles.txRow}>
                                  <View style={styles.accountInfo}>
                                    <Text style={styles.txTitle}>{tx.description || 'Lançamento'}</Text>
                                    <Text style={styles.txSubtitle}>{tx.date} · {tx.category_name || 'Geral'}</Text>
                                  </View>
                                  <Text style={isIncome ? styles.incomeValue : styles.expenseValue}>
                                    {sign}{formatCurrency(Number(tx.amount) || 0)}
                                  </Text>
                                </View>
                              </View>
                            )
                          })
                        ) : (
                          <Text style={styles.emptyTxText}>Nenhuma movimentação registrada nesta conta.</Text>
                        )}

                        <Text style={styles.consolidatedNote}>
                          Saldo consolidado no Koin. Não é um extrato bancário oficial.
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}

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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardHeader: {
    gap: 4,
    flex: 1,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
  emptyCardBox: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
  },
  emptyCardSubtitle: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  emptyAddButton: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyTxText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    paddingVertical: 10,
    textAlign: 'center',
  },
})
