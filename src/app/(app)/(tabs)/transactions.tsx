import Ionicons from '@expo/vector-icons/Ionicons'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { StateView } from '@/components/StateView'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { recurringApi } from '@/services/features.api'
import { notificationsApi } from '@/services/settings.api'
import { installmentsApi, transactionsApi } from '@/services/transactions.api'
import { darkTheme } from '@/theme/colors'
import type { Transaction } from '@/types/api'

interface DisplayTransaction {
  id: number | string
  title: string
  subtitle: string
  amount: number
  isIncome: boolean
  formattedAmount: string
  dateGroup: string
  badge?: string
  iconName: keyof typeof Ionicons.glyphMap
}

const FIGMA_MOCK_ITEMS: DisplayTransaction[] = [
  {
    id: 101,
    title: 'Fone de ouvido',
    subtitle: 'Eletrônicos, Nubank • 3x de R$ 200',
    amount: 600,
    isIncome: false,
    formattedAmount: '– R$ 600,00',
    dateGroup: '1º de outubro',
    badge: 'Novo • Fatura nov',
    iconName: 'headset-outline',
  },
  {
    id: 102,
    title: 'Mercado Extra',
    subtitle: 'Alimentação, Nubank',
    amount: 450,
    isIncome: false,
    formattedAmount: '– R$ 450,00',
    dateGroup: '25 de setembro',
    badge: 'Família • Fatura nov',
    iconName: 'cart-outline',
  },
  {
    id: 103,
    title: 'Netflix',
    subtitle: 'Assinaturas, Nubank',
    amount: 55.9,
    isIncome: false,
    formattedAmount: '– R$ 55,90',
    dateGroup: '15 de setembro',
    badge: 'Assinatura • Família',
    iconName: 'repeat-outline',
  },
  {
    id: 104,
    title: 'Salário',
    subtitle: 'Receita, Conta Itaú',
    amount: 6500,
    isIncome: true,
    formattedAmount: '+ R$ 6.500,00',
    dateGroup: '5 de setembro',
    iconName: 'wallet-outline',
  },
  {
    id: 105,
    title: 'Pagamento da fatura Nubank',
    subtitle: 'Origem: pagamento de fatura • Itaú',
    amount: 2100,
    isIncome: false,
    formattedAmount: 'R$ 2.100,00',
    dateGroup: '5 de setembro',
    badge: 'Fora do resumo',
    iconName: 'card-outline',
  },
]

type FilterTab = 'all' | 'installments' | 'recurring'

function getCategoryIcon(categoryName?: string | null): keyof typeof Ionicons.glyphMap {
  const cat = (categoryName || '').toLowerCase()
  if (cat.includes('eletrôn') || cat.includes('tecnol') || cat.includes('músic')) return 'headset-outline'
  if (cat.includes('alimen') || cat.includes('mercado') || cat.includes('comida')) return 'cart-outline'
  if (cat.includes('assin') || cat.includes('stream') || cat.includes('serviço')) return 'repeat-outline'
  if (cat.includes('salário') || cat.includes('receita') || cat.includes('invest')) return 'wallet-outline'
  if (cat.includes('fatura') || cat.includes('cartão') || cat.includes('transfer')) return 'card-outline'
  return 'receipt-outline'
}

function formatDateToGroup(dateString: string): string {
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    const day = d.getDate()
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]
    const month = months[d.getMonth()]
    return day === 1 ? `1º de ${month}` : `${day} de ${month}`
  } catch {
    return dateString
  }
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets()
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all')
  const [showSearch, setShowSearch] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const query = useInfiniteQuery({
    queryKey: ['transactions', 'list', { search }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await transactionsApi.list({
          limit: 20,
          offset: pageParam,
          ...(search ? { search } : {}),
        })
      ).data,
    getNextPageParam: (last) => (last.has_more ? last.offset + last.limit : undefined),
  })

  // Queries reais adicionais integradas ao backend
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data,
  })
  const unreadCount = unreadData?.unread_count ?? 2

  const installmentsQuery = useQuery({
    queryKey: ['installments', 'list'],
    queryFn: async () => (await installmentsApi.list()).data,
    enabled: selectedTab === 'installments',
  })

  const recurringQuery = useQuery({
    queryKey: ['recurring', 'list'],
    queryFn: async () => (await recurringApi.list()).data,
    enabled: selectedTab === 'recurring',
  })

  const displayItems = useMemo<DisplayTransaction[]>(() => {
    // 1. Aba Parcelamentos com dados reais do backend
    if (selectedTab === 'installments' && Array.isArray(installmentsQuery.data) && installmentsQuery.data.length > 0) {
      return installmentsQuery.data.map((inst: any) => {
        const total = Number(inst.total_amount) || 0
        const totalInst = inst.total_installments || 1
        return {
          id: `inst-${inst.id}`,
          title: inst.description || inst.merchant_name || 'Parcelamento',
          subtitle: `${inst.total_installments ? `${inst.current_installment || 1}x de ${formatCurrency(total / totalInst)}` : 'Parcelas'}`,
          amount: total,
          isIncome: false,
          formattedAmount: `– ${formatCurrency(total)}`,
          dateGroup: formatDateToGroup(inst.created_at || new Date().toISOString()),
          badge: 'Parcelamento ativo',
          iconName: 'headset-outline',
        }
      })
    }

    // 2. Aba Recorrentes com dados reais do backend
    if (selectedTab === 'recurring' && Array.isArray(recurringQuery.data) && recurringQuery.data.length > 0) {
      return recurringQuery.data.map((rec: any) => {
        const val = Number(rec.amount) || 0
        return {
          id: `rec-${rec.id}`,
          title: rec.name || rec.description || 'Assinatura',
          subtitle: `${rec.frequency || 'Mensal'} • ${rec.category_name || 'Serviço'}`,
          amount: val,
          isIncome: false,
          formattedAmount: `– ${formatCurrency(val)}`,
          dateGroup: 'Recorrentes',
          badge: 'Assinatura',
          iconName: 'repeat-outline',
        }
      })
    }

    // 3. Aba Todas com transações reais do backend
    const apiTransactions = query.data?.pages.flatMap((p) => p.items) ?? []
    if (apiTransactions.length > 0) {
      return apiTransactions.map((t: Transaction) => {
        const numAmount = Number(t.amount) || 0
        const isIncome = t.type === 'income'
        const sign = isIncome ? '+ ' : '– '
        const formattedAmount = `${sign}${formatCurrency(numAmount)}`
        const dateGroup = formatDateToGroup(t.date)
        const parts = [t.category_name, t.account_name].filter(Boolean)
        if (t.installment_number && t.installment_total) {
          parts.push(`${t.installment_number}x de ${formatCurrency(numAmount / t.installment_total)}`)
        }
        return {
          id: t.id,
          title: t.description || t.merchant_name || t.category_name || 'Transação',
          subtitle: parts.join(' • ') || 'Transação',
          amount: numAmount,
          isIncome,
          formattedAmount,
          dateGroup,
          badge: t.tags && t.tags.length > 0 ? t.tags.join(' • ') : undefined,
          iconName: getCategoryIcon(t.category_name),
        }
      })
    }

    // Fallback to pixel-perfect Figma mock transactions
    let filtered = FIGMA_MOCK_ITEMS
    if (selectedTab === 'installments') {
      filtered = filtered.filter((i) => i.subtitle.includes('x de'))
    } else if (selectedTab === 'recurring') {
      filtered = filtered.filter((i) => i.badge?.includes('Assinatura'))
    }
    if (search.trim()) {
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.subtitle.toLowerCase().includes(search.toLowerCase())
      )
    }
    return filtered
  }, [query.data, selectedTab, search, installmentsQuery.data, recurringQuery.data])

  // Group items by dateGroup
  const groupedSections = useMemo(() => {
    const map = new Map<string, DisplayTransaction[]>()
    displayItems.forEach((item) => {
      const current = map.get(item.dateGroup) || []
      current.push(item)
      map.set(item.dateGroup, current)
    })
    return Array.from(map.entries()).map(([dateGroup, items]) => ({
      dateGroup,
      items,
    }))
  }, [displayItems])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Figma Barra Superior */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Movimentações</Text>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            style={styles.iconButton}
            onPress={() => setShowSearch((prev) => !prev)}
          >
            <Ionicons name="search-outline" size={22} color={darkTheme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={styles.iconButton}
          >
            <Ionicons name="notifications-outline" size={22} color={darkTheme.text} />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search Input Bar (Expandable) */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={darkTheme.textMuted} />
          <TextInput
            value={searchInput}
            onChangeText={(text) => {
              setSearchInput(text)
              setSearch(text.trim())
            }}
            placeholder="Buscar por nome, categoria ou conta..."
            placeholderTextColor={darkTheme.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoFocus
          />
          {searchInput.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchInput('')
                setSearch('')
              }}
            >
              <Ionicons name="close-circle" size={18} color={darkTheme.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Content Area */}
      <FlatList
        data={groupedSections}
        keyExtractor={(item) => item.dateGroup}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.headerControls}>
            {/* Filter Tabs Chips */}
            <View style={styles.tabsRow}>
              <Pressable
                style={[styles.tabChip, selectedTab === 'all' && styles.tabChipActive]}
                onPress={() => setSelectedTab('all')}
              >
                <Text style={[styles.tabChipText, selectedTab === 'all' && styles.tabChipTextActive]}>
                  Transações
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabChip, selectedTab === 'installments' && styles.tabChipActive]}
                onPress={() => setSelectedTab('installments')}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    selectedTab === 'installments' && styles.tabChipTextActive,
                  ]}
                >
                  Parcelamentos
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabChip, selectedTab === 'recurring' && styles.tabChipActive]}
                onPress={() => setSelectedTab('recurring')}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    selectedTab === 'recurring' && styles.tabChipTextActive,
                  ]}
                >
                  Recorrentes
                </Text>
              </Pressable>
            </View>

            {/* Date Range Chip */}
            <Pressable style={styles.dateRangeChip}>
              <Text style={styles.dateRangeText}>Setembro e outubro de 2026 ⌄</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.sectionGroup}>
            <Text style={styles.dateHeader}>{section.dateGroup}</Text>
            {section.items.map((item) => (
              <Pressable
                key={String(item.id)}
                style={({ pressed }) => [styles.transactionRow, pressed && styles.rowPressed]}
                onPress={() => router.push(`/transaction/${item.id}` as any)}
              >
                <View style={styles.rowMain}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.iconName} size={20} color={darkTheme.accentLight} />
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.rowAmount,
                      item.isIncome && styles.rowAmountIncome,
                    ]}
                  >
                    {item.formattedAmount}
                  </Text>
                </View>

                {Boolean(item.badge) && (
                  <View style={styles.rowBadgeChip}>
                    <Text style={styles.rowBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <StateView
            loading={query.isLoading}
            error={query.error ? getApiErrorMessage(query.error, 'Não foi possível carregar as transações') : null}
            empty="Nenhuma movimentação encontrada"
            onRetry={query.refetch}
          />
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} /> : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080512',
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 10,
  },
  topBarTitle: {
    fontSize: 26,
    fontFamily: 'Sora',
    fontWeight: '400',
    color: '#f8fafc',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    borderWidth: 2,
    borderColor: '#080512',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Geist',
    fontWeight: '700',
    color: '#ffffff',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2b233c',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  headerControls: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabChip: {
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
  tabChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderColor: '#7c3aed',
  },
  tabChipText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a7a1b7',
  },
  tabChipTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  dateRangeChip: {
    alignSelf: 'flex-start',
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
  dateRangeText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a7a1b7',
  },
  sectionGroup: {
    marginTop: 16,
  },
  dateHeader: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    marginBottom: 8,
  },
  transactionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2b233c',
    gap: 8,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  rowAmount: {
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '500',
    color: '#f8fafc',
  },
  rowAmountIncome: {
    color: '#34d399',
  },
  rowBadgeChip: {
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 50, // aligns under the text
  },
  rowBadgeText: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  footerLoader: {
    paddingVertical: 16,
  },
})
