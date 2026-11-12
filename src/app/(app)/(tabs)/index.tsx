import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BankCardTile } from '@/components/BankCardTile'
import { CommittedOutlook, type OutlookRange } from '@/components/home/CommittedOutlook'
import { StartWithInvoiceHero } from '@/components/home/StartWithInvoiceHero'
import { ScopeToggle, type Scope } from '@/components/ScopeToggle'
import { activeCreditCards, creditCardLabel } from '@/lib/creditCards'
import { formatCurrency } from '@/lib/format'
import { accountsApi, creditCardsApi } from '@/services/accounts.api'
import { invoicesApi } from '@/services/documents.api'
import { analyticsApi } from '@/services/analytics.api'
import { notificationsApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export default function DashboardScreen() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = MONTH_NAMES[now.getMonth()]

  const [filterMode, setFilterMode] = useState<Scope>('me')
  const [outlookRange, setOutlookRange] = useState<OutlookRange>(6)
  const { width: screenWidth } = useWindowDimensions()

  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary', currentYear, currentMonth],
    queryFn: async () => (await analyticsApi.summary(currentYear, currentMonth)).data,
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const cardsQuery = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => (await creditCardsApi.list()).data,
  })

  const activeCards = activeCreditCards(cardsQuery.data)

  // Parcelas já compradas nas faturas dos próximos meses (só eu ou família)
  const outlookQuery = useQuery({
    queryKey: ['invoices', 'outlook', filterMode, outlookRange],
    queryFn: async () => (await invoicesApi.outlook(outlookRange, filterMode)).data,
    placeholderData: (previous) => previous,
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data,
  })
  const unreadCount = notificationsQuery.data?.unread_count ?? 0

  const refreshing =
    summaryQuery.isRefetching ||
    accountsQuery.isRefetching ||
    notificationsQuery.isRefetching ||
    cardsQuery.isRefetching ||
    outlookQuery.isRefetching
  const onRefresh = () => {
    outlookQuery.refetch()
    summaryQuery.refetch()
    accountsQuery.refetch()
    notificationsQuery.refetch()
    cardsQuery.refetch()
  }

  const s = summaryQuery.data
  const totalExpense = s?.total_expense ?? 0
  const totalIncome = s?.total_income ?? 0
  const balance = s?.balance ?? 0
  const variation = s?.expense_variation ?? null
  const cardExpense = Math.max(s?.credit_card_expenses ?? 0, 0)
  const otherExpense = Math.max(s?.debit_cash_expenses ?? 0, 0)
  const topCategories = useMemo(
    () => [...(s?.categories ?? [])].filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 4),
    [s]
  )
  const topCategoryTotal = topCategories[0]?.total ?? 0
  const openTotal = activeCards.reduce((sum, c) => sum + Math.max(Number(c.current_balance) || 0, 0), 0)
  const tileWidth = Math.min(screenWidth - 56, 340)

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Início</Text>
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
        <ScopeToggle value={filterMode} onChange={setFilterMode} />

        {/* Resumo do mês */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver resumo de ${monthName}`}
          onPress={() => router.push('/monthly-summary')}
          style={({ pressed }) => pressed && styles.buttonPressed}
        >
          <LinearGradient
            colors={['#1f0c3b', '#120e1e', '#0a0414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryMonth}>Gastos de {monthName}</Text>
              <Feather name="chevron-right" size={18} color={darkTheme.textSecondary} />
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={[styles.summaryTotal, summaryQuery.isLoading && styles.loading]}>
                {formatCurrency(totalExpense)}
              </Text>
              {variation !== null && Number.isFinite(variation) && (
                <View
                  style={[styles.variationPill, variation > 0 ? styles.variationUp : styles.variationDown]}
                  accessible
                  accessibilityLabel={`${Math.abs(Math.round(variation))}% ${variation > 0 ? 'a mais' : 'a menos'} que no mês passado`}
                >
                  <Feather
                    name={variation > 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={variation > 0 ? darkTheme.error : darkTheme.success}
                  />
                  <Text style={[styles.variationText, { color: variation > 0 ? darkTheme.error : darkTheme.success }]}>
                    {Math.abs(Math.round(variation))}%
                  </Text>
                </View>
              )}
            </View>

            {cardExpense > 0 && otherExpense > 0 && (
              <View style={styles.splitBox}>
                <View style={styles.splitTrack}>
                  <View style={[styles.splitCard, { flex: cardExpense }]} />
                  <View style={[styles.splitOther, { flex: otherExpense }]} />
                </View>
                <View style={styles.splitLegend}>
                  <Text style={styles.splitLabel}>
                    <Text style={styles.splitDotCard}>●</Text> Cartão {formatCurrency(cardExpense)}
                  </Text>
                  <Text style={styles.splitLabel}>
                    <Text style={styles.splitDotOther}>●</Text> Débito e dinheiro {formatCurrency(otherExpense)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryColumnLabel}>Receitas</Text>
                <Text style={styles.incomeValue}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryColumnLabel}>Sobrou</Text>
                <Text style={[styles.balanceValue, balance < 0 && { color: darkTheme.error }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryNote}>Pagamentos de fatura ficam fora deste total.</Text>
          </LinearGradient>
        </Pressable>

        {cardsQuery.isSuccess && activeCards.length === 0 ? (
          <StartWithInvoiceHero />
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Seus cartões</Text>
                {activeCards.length > 0 && (
                  <Text style={styles.sectionSubtitle}>
                    {formatCurrency(openTotal)} em aberto em {activeCards.length}{' '}
                    {activeCards.length === 1 ? 'cartão' : 'cartões'}
                  </Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar fatura"
                hitSlop={8}
                onPress={() => router.push('/invoice/import')}
              >
                <Text style={styles.viewAllText}>Enviar fatura</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={activeCards.length > 1 ? tileWidth + 12 : undefined}
              decelerationRate="fast"
              contentContainerStyle={styles.carousel}
              style={styles.carouselBleed}
            >
              {activeCards.map((card) => (
                <BankCardTile
                  key={String(card.id)}
                  card={card}
                  width={activeCards.length > 1 ? tileWidth : screenWidth - 32}
                  onPress={() =>
                    router.push({
                      pathname: '/invoices',
                      params: { creditCardId: String(card.id), creditCardName: creditCardLabel(card) },
                    } as any)
                  }
                />
              ))}
            </ScrollView>

            <CommittedOutlook
              key={filterMode}
              outlook={outlookQuery.data}
              family={filterMode === 'family'}
              range={outlookRange}
              onRangeChange={setOutlookRange}
              loading={outlookQuery.isFetching && !outlookQuery.isRefetching}
            />
          </>
        )}

        {/* Para onde foi o dinheiro */}
        {topCategories.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver gastos por categoria"
            onPress={() => router.push('/monthly-summary')}
            style={({ pressed }) => [styles.categoriesCard, pressed && styles.buttonPressed]}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Para onde foi</Text>
              <Text style={styles.viewAllText}>Ver tudo</Text>
            </View>
            {topCategories.map((c, i) => (
              <View key={`${c.category_id ?? 'none'}-${c.category_name}`} style={styles.categoryRow}>
                <View style={styles.categoryTop}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {c.category_name || 'Sem categoria'}
                  </Text>
                  <Text style={styles.categoryAmount}>{formatCurrency(c.total)}</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View
                    style={[
                      styles.categoryFill,
                      {
                        width: `${topCategoryTotal > 0 ? Math.max((c.total / topCategoryTotal) * 100, 3) : 0}%`,
                        opacity: 1 - i * 0.18,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Pressable>
        )}

        {/* Alertas */}
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver alertas"
            onPress={() => router.push('/notifications' as any)}
            style={({ pressed }) => [styles.alertCard, pressed && styles.buttonPressed]}
          >
            <View style={styles.alertIconWrapper}>
              <Feather name="bell" size={16} color={darkTheme.accent} />
            </View>
            <View style={styles.alertMessageWrapper}>
              <Text style={styles.alertTitle}>Notificações pendentes</Text>
              <Text style={styles.alertSubtitle}>
                Você tem {unreadCount} {unreadCount === 1 ? 'alerta' : 'alertas'} para revisar.
              </Text>
            </View>
            <View style={styles.alertActionPill}>
              <Text style={styles.alertActionText}>Ver</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCardMini}>
            <Feather name="check-circle" size={16} color={darkTheme.accent} />
            <Text style={styles.emptyTextMini}>Tudo em dia! Nenhum alerta pendente.</Text>
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
    paddingBottom: 28,
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    color: darkTheme.accent,
    fontWeight: '400',
  },
  alertsContainer: {
    gap: 8,
  },
  alertCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertMessageWrapper: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  alertSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  alertActionPill: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.accent,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  summaryMonth: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loading: { opacity: 0.5 },
  variationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  variationUp: { backgroundColor: darkTheme.errorBackground, borderColor: darkTheme.errorBorder },
  variationDown: { backgroundColor: darkTheme.successBackground, borderColor: darkTheme.successBorder },
  variationText: { fontSize: 12, fontWeight: '600' },
  splitBox: { gap: 6 },
  splitTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
    backgroundColor: darkTheme.surfaceSecondary,
  },
  splitCard: { backgroundColor: darkTheme.primary },
  splitOther: { backgroundColor: darkTheme.accentLight },
  splitLegend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2 },
  splitLabel: { fontSize: 12, color: darkTheme.textSecondary },
  splitDotCard: { color: darkTheme.primary },
  splitDotOther: { color: darkTheme.accentLight },
  sectionSubtitle: { fontSize: 12, color: darkTheme.textSecondary, marginTop: 2 },
  carouselBleed: { marginHorizontal: -16 },
  carousel: { paddingHorizontal: 16, gap: 12 },
  categoriesCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  categoryRow: { gap: 6 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  categoryName: { flex: 1, fontSize: 13, color: darkTheme.text },
  categoryAmount: { fontSize: 13, fontWeight: '600', color: darkTheme.text },
  categoryTrack: { height: 6, borderRadius: 3, backgroundColor: darkTheme.surfaceSecondary, overflow: 'hidden' },
  categoryFill: { height: 6, borderRadius: 3, backgroundColor: darkTheme.accent },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  summaryColumn: {
    flex: 1,
    gap: 3,
  },
  summaryColumnLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.success,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  summaryNote: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  invoicesCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  invoiceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceInfo: {
    flex: 1,
    gap: 3,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  invoiceSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: darkTheme.border,
  },
  emptyCardMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyTextMini: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  emptyInvoiceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  emptyInvoiceInfo: {
    flex: 1,
    gap: 2,
  },
  emptyInvoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  emptyInvoiceSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 16,
  },
})
