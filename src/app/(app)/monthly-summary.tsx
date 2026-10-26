import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScopeToggle, type Scope } from '@/components/ScopeToggle'
import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { invoicesApi } from '@/services/documents.api'
import { analyticsApi } from '@/services/analytics.api'
import { darkTheme } from '@/theme/colors'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

/** Cores das fatias, na ordem das categorias (maior gasto primeiro). */
const SEGMENT_COLORS = ['#7c3aed', '#f59e0b', '#38bdf8', '#2dd4bf', '#a78bfa']
const MAX_CATEGORIES = SEGMENT_COLORS.length

interface CategoryRow {
  key: string
  name: string
  total: number
  color: string
}

export default function MonthlySummaryScreen() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [scope, setScope] = useState<Scope>('me')

  const isCurrentMonth = period.year === now.getFullYear() && period.month === now.getMonth() + 1

  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary', period.year, period.month],
    queryFn: async () => (await analyticsApi.summary(period.year, period.month)).data,
  })

  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'overview', period.year, period.month],
    queryFn: async () => (await invoicesApi.overview(period.year, period.month)).data,
  })

  const summary = summaryQuery.data

  // Despesas do protótipo = soma das categorias (gastos contados no dia da compra),
  // por isso a fatura do cartão fica de fora e é explicada na nota abaixo do card.
  const categories = useMemo<CategoryRow[]>(() => {
    const sorted = [...(summary?.categories ?? [])]
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)

    const head = sorted.slice(0, sorted.length > MAX_CATEGORIES ? MAX_CATEGORIES - 1 : MAX_CATEGORIES)
    const rest = sorted.slice(head.length)

    const rows = head.map((c, i) => ({
      key: String(c.category_id ?? `sem-categoria-${i}`),
      name: c.category_name,
      total: c.total,
      color: SEGMENT_COLORS[i],
    }))
    if (rest.length > 0) {
      rows.push({
        key: 'outros',
        name: 'Outros',
        total: rest.reduce((sum, c) => sum + c.total, 0),
        color: SEGMENT_COLORS[MAX_CATEGORIES - 1],
      })
    }
    return rows
  }, [summary])

  const totalExpense = categories.reduce((sum, c) => sum + c.total, 0)
  const totalIncome = summary?.total_income ?? 0
  const balance = totalIncome - totalExpense
  const topTotal = categories[0]?.total ?? 0

  const invoicesTotal = (invoicesQuery.data?.items ?? []).reduce(
    (sum, item) => sum + (item.total_amount ?? 0),
    0
  )

  const changeMonth = (delta: number) => {
    setPeriod(({ year, month }) => {
      const index = year * 12 + (month - 1) + delta
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })
  }

  const refreshing = summaryQuery.isRefetching || invoicesQuery.isRefetching
  const onRefresh = () => {
    summaryQuery.refetch()
    invoicesQuery.refetch()
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title="Resumo do mês" />

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
        {/* Seletor de mês */}
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            hitSlop={10}
            onPress={() => changeMonth(-1)}
            style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}
          >
            <Feather name="chevron-left" size={18} color={darkTheme.textSecondary} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[period.month - 1]} de {period.year}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            accessibilityState={{ disabled: isCurrentMonth }}
            disabled={isCurrentMonth}
            hitSlop={10}
            onPress={() => changeMonth(1)}
            style={({ pressed }) => [
              styles.monthArrow,
              pressed && styles.pressed,
              isCurrentMonth && styles.arrowDisabled,
            ]}
          >
            <Feather name="chevron-right" size={18} color={darkTheme.textSecondary} />
          </Pressable>
        </View>

        <ScopeToggle value={scope} onChange={setScope} />

        {summaryQuery.isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={darkTheme.accent} size="large" />
          </View>
        ) : summaryQuery.isError ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{getApiErrorMessage(summaryQuery.error, 'Não foi possível carregar o resumo do mês')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => summaryQuery.refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Cartão-resumo */}
            <LinearGradient
              colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(totalExpense)}</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Receitas</Text>
                <Text style={styles.summaryRowValue}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Sobrou</Text>
                <Text style={styles.summaryRowValue}>{formatCurrency(balance)}</Text>
              </View>

              <View
                accessible
                accessibilityLabel="Proporção das despesas por categoria"
                style={styles.segmentedBar}
              >
                {categories.map((c) => (
                  <View
                    key={c.key}
                    style={[styles.segment, { flex: c.total, backgroundColor: c.color }]}
                  />
                ))}
              </View>
            </LinearGradient>

            {/* Nota sobre faturas */}
            {invoicesTotal > 0 && (
              <View style={styles.noteCard}>
                <Feather name="info" size={18} color={darkTheme.accent} style={styles.noteIcon} />
                <Text style={styles.noteText}>
                  Pagamentos de fatura ({formatCurrency(invoicesTotal)}) ficam fora deste total,
                  porque os gastos já foram contados no dia da compra.
                </Text>
              </View>
            )}

            {/* Por categoria */}
            <View style={styles.categoriesCard}>
              <Text style={styles.categoriesTitle}>Por categoria</Text>

              {categories.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma despesa registrada neste mês.</Text>
              ) : (
                categories.map((c) => (
                  <View key={c.key} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      <Text numberOfLines={1} style={styles.categoryName}>
                        {c.name}
                      </Text>
                      <Text style={styles.categoryValue}>{formatCurrency(c.total)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${(c.total / topTotal) * 100}%`, backgroundColor: darkTheme.primary },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
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
  pressed: {
    opacity: 0.75,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  monthArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: darkTheme.text,
  },
  stateBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 16,
  },
  stateText: {
    fontSize: 15,
    color: darkTheme.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: darkTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.accent,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 24,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  summaryTotal: {
    fontSize: 38,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.8,
    marginTop: 6,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.text,
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 4,
    height: 8,
    marginTop: 10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    height: 8,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: darkTheme.textSecondary,
  },
  categoriesCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 24,
    padding: 16,
    gap: 23,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  categoryItem: {
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: darkTheme.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
})
