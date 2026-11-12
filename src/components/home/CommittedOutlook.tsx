import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { BankLogo } from '@/components/BankLogo'
import { assignCardColors, resolveBank, withAlpha, type BankIdentity } from '@/lib/banks'
import { formatCurrency } from '@/lib/format'
import { darkTheme } from '@/theme/colors'
import type { InvoiceOutlook, InvoiceOutlookCard } from '@/types/api'

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const LONG_MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
export const OUTLOOK_RANGES = [3, 6, 12] as const
export type OutlookRange = (typeof OUTLOOK_RANGES)[number]

const CHART_HEIGHT = 150
const AXIS_WIDTH = 54
const NO_CARD_COLOR = '#64748b'

interface Props {
  outlook: InvoiceOutlook | undefined
  family: boolean
  range: OutlookRange
  onRangeChange: (range: OutlookRange) => void
  loading?: boolean
}

interface CardSeries {
  key: string
  card: InvoiceOutlookCard
  bank: BankIdentity
  color: string
}

const keyOf = (id: number | null) => (id === null ? 'none' : String(id))

/** Topo do eixo em um número redondo (R$ 500, R$ 1.000, R$ 2.500...) */
function niceMax(value: number): number {
  if (value <= 0) return 100
  const pow = 10 ** Math.floor(Math.log10(value))
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    if (m * pow >= value) return m * pow
  }
  return 10 * pow
}

function compactCurrency(value: number): string {
  if (value >= 1000) {
    const k = value / 1000
    return `R$ ${k.toLocaleString('pt-BR', { maximumFractionDigits: k >= 10 ? 0 : 1 })} mil`
  }
  return `R$ ${Math.round(value)}`
}

/**
 * Parcelas já compradas, por fatura dos próximos meses e separadas por cartão
 * (GET /invoices/outlook). Toque numa barra para ver a fatura daquele mês, e num cartão
 * da legenda para mostrar ou esconder o cartão no gráfico.
 */
export function CommittedOutlook({ outlook, family, range, onRangeChange, loading }: Props) {
  const months = useMemo(() => outlook?.months ?? [], [outlook])

  const series: CardSeries[] = useMemo(() => {
    const cards = outlook?.cards ?? []
    const withBank = cards.map((card) => ({
      key: keyOf(card.credit_card_id),
      card,
      bank:
        card.credit_card_id === null
          ? { ...resolveBank({ name: 'Fora do cartão' }), color: NO_CARD_COLOR, chartColor: NO_CARD_COLOR }
          : resolveBank({ bank_id: card.bank_id, name: card.name, card_brand: card.card_brand }),
    }))
    const colors = assignCardColors(withBank.map((s) => ({ key: s.key, bank: s.bank })))
    return withBank.map((s) => ({ ...s, color: colors.get(s.key) ?? s.bank.chartColor }))
  }, [outlook])

  const [hiddenRaw, setHidden] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  // cartões que sumiram da projeção não ficam presos como escondidos
  const hidden = useMemo(
    () => new Set([...hiddenRaw].filter((k) => series.some((s) => s.key === k))),
    [hiddenRaw, series]
  )

  const changeRange = (r: OutlookRange) => {
    // nova janela de meses: volta para o mês atual
    setSelected(0)
    setExpanded(null)
    onRangeChange(r)
  }

  const hasBreakdown = months.some((m) => m.by_card !== undefined)

  const visibleTotal = (m: (typeof months)[number]) =>
    hasBreakdown
      ? (m.by_card ?? []).filter((b) => !hidden.has(keyOf(b.credit_card_id))).reduce((sum, b) => sum + b.total, 0)
      : m.total

  const periodTotal = months.reduce((sum, m) => sum + visibleTotal(m), 0)
  const axisMax = niceMax(Math.max(...months.map(visibleTotal), 0))
  const current = months[Math.min(selected, Math.max(months.length - 1, 0))]
  const seriesByKey = new Map(series.map((s) => [s.key, s]))

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else if (series.length - next.size > 1) next.add(key) // sempre sobra pelo menos um cartão
      return next
    })
  }

  const onlyThis = (key: string) => {
    setHidden((prev) => {
      const isolated = prev.size === series.length - 1 && !prev.has(key)
      return isolated ? new Set() : new Set(series.filter((s) => s.key !== key).map((s) => s.key))
    })
  }

  const filtered = hidden.size > 0
  const barGap = months.length > 6 ? 5 : 10

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {family ? 'Comprometido pela família' : 'Já comprometido'}
        </Text>
        <View style={styles.ranges} accessibilityRole="tablist">
          {OUTLOOK_RANGES.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="tab"
              accessibilityState={{ selected: r === range }}
              accessibilityLabel={`Próximos ${r} meses`}
              hitSlop={6}
              onPress={() => changeRange(r)}
              style={[styles.rangeChip, r === range && styles.rangeChipActive]}
            >
              <Text style={[styles.rangeText, r === range && styles.rangeTextActive]}>{r}m</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={[styles.total, loading && styles.loading]}>{formatCurrency(periodTotal)}</Text>
      <Text style={styles.hint}>
        {periodTotal > 0
          ? `Parcelas já compradas que caem nas faturas dos próximos ${months.length || range} meses${
              filtered ? ', só dos cartões selecionados' : ''
            }.`
          : 'Nenhuma parcela em aberto. Compras parceladas aparecem aqui assim que entram numa fatura.'}
      </Text>

      {months.length > 0 && periodTotal > 0 && (
        <View style={styles.chart}>
          <View style={styles.axis} pointerEvents="none">
            {[1, 0.5, 0].map((f) => (
              <View key={f} style={[styles.gridLine, { top: (1 - f) * CHART_HEIGHT }]}>
                <Text style={styles.gridLabel}>{f === 0 ? '' : compactCurrency(axisMax * f)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.bars, { gap: barGap }]}>
            {months.map((m, index) => {
              const total = visibleTotal(m)
              const isSelected = index === selected
              const segments = hasBreakdown
                ? (m.by_card ?? []).filter((b) => !hidden.has(keyOf(b.credit_card_id)) && b.total > 0)
                : [{ credit_card_id: null, total: m.total }]
              return (
                <Pressable
                  key={`${m.year}-${m.month}`}
                  style={styles.barCol}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Fatura de ${LONG_MONTHS[m.month - 1]}: ${formatCurrency(total)}`}
                  onPress={() => {
                    setSelected(index)
                    setExpanded(null)
                  }}
                >
                  <View style={[styles.barTrack, isSelected && styles.barTrackSelected]}>
                    <View style={[styles.stack, { height: `${(total / axisMax) * 100}%`, opacity: isSelected ? 1 : 0.55 }]}>
                      {segments.map((b, i) => (
                        <View
                          key={keyOf(b.credit_card_id)}
                          style={{
                            flex: b.total,
                            backgroundColor: hasBreakdown
                              ? seriesByKey.get(keyOf(b.credit_card_id))?.color ?? NO_CARD_COLOR
                              : darkTheme.primary,
                            borderTopLeftRadius: i === 0 ? 6 : 0,
                            borderTopRightRadius: i === 0 ? 6 : 0,
                            marginBottom: i < segments.length - 1 ? 1 : 0,
                          }}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.month, isSelected && styles.monthCurrent]} numberOfLines={1}>
                    {/* com 12 barras não cabe o nome: fica a inicial (o mês inteiro aparece embaixo) */}
                    {months.length > 6 ? SHORT_MONTHS[m.month - 1][0].toUpperCase() : SHORT_MONTHS[m.month - 1]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      {series.length > 0 && (outlook?.total ?? 0) > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legend}>
          {series.map((s) => {
            const off = hidden.has(s.key)
            return (
              <Pressable
                key={s.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !off }}
                accessibilityLabel={`${s.card.name}: ${formatCurrency(s.card.total)}`}
                accessibilityHint="Toque para mostrar ou esconder, segure para ver só este cartão"
                onPress={() => toggle(s.key)}
                onLongPress={() => onlyThis(s.key)}
                style={[
                  styles.legendChip,
                  { borderColor: off ? darkTheme.border : withAlpha(s.color, 0.7) },
                  !off && { backgroundColor: withAlpha(s.color, 0.14) },
                ]}
              >
                {s.card.credit_card_id === null ? (
                  <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                ) : (
                  <BankLogo bank={s.bank} size={18} />
                )}
                <Text style={[styles.legendText, off && styles.legendTextOff]} numberOfLines={1}>
                  {s.card.name}
                  {s.card.last_four_digits ? ` ·${s.card.last_four_digits}` : ''}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}

      {current && periodTotal > 0 && (
        <View style={styles.detail}>
          <View style={styles.detailHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mês anterior"
              disabled={selected === 0}
              hitSlop={8}
              onPress={() => {
                setSelected((v) => Math.max(v - 1, 0))
                setExpanded(null)
              }}
              style={[styles.navButton, selected === 0 && styles.navDisabled]}
            >
              <Feather name="chevron-left" size={18} color={darkTheme.text} />
            </Pressable>
            <View style={styles.detailTitleBox}>
              <Text style={styles.detailTitle}>
                Fatura de {LONG_MONTHS[current.month - 1]}
                {current.year !== months[0]?.year ? ` de ${current.year}` : ''}
              </Text>
              <Text style={styles.detailTotal}>{formatCurrency(visibleTotal(current))}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próximo mês"
              disabled={selected >= months.length - 1}
              hitSlop={8}
              onPress={() => {
                setSelected((v) => Math.min(v + 1, months.length - 1))
                setExpanded(null)
              }}
              style={[styles.navButton, selected >= months.length - 1 && styles.navDisabled]}
            >
              <Feather name="chevron-right" size={18} color={darkTheme.text} />
            </Pressable>
          </View>

          {!hasBreakdown ? null : (current.by_card ?? []).filter((b) => !hidden.has(keyOf(b.credit_card_id))).length ===
            0 ? (
            <Text style={styles.empty}>Nenhuma parcela neste mês.</Text>
          ) : (
            (current.by_card ?? [])
              .filter((b) => !hidden.has(keyOf(b.credit_card_id)))
              .map((b) => {
                const key = keyOf(b.credit_card_id)
                const s = seriesByKey.get(key)
                const share = visibleTotal(current) > 0 ? b.total / visibleTotal(current) : 0
                const open = expanded === key
                return (
                  <View key={key} style={styles.cardRowBox}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityLabel={`${s?.card.name ?? 'Cartão'}: ${formatCurrency(b.total)}, ${b.installments_count} parcelas`}
                      onPress={() => setExpanded(open ? null : key)}
                      style={styles.cardRow}
                    >
                      {s && s.card.credit_card_id !== null ? (
                        <BankLogo bank={s.bank} size={32} />
                      ) : (
                        <View style={[styles.noCardIcon]}>
                          <Feather name="layers" size={15} color={darkTheme.textSecondary} />
                        </View>
                      )}
                      <View style={styles.cardRowInfo}>
                        <View style={styles.cardRowTop}>
                          <Text style={styles.cardRowName} numberOfLines={1}>
                            {s?.card.name ?? 'Cartão'}
                            {s?.card.last_four_digits ? ` final ${s.card.last_four_digits}` : ''}
                          </Text>
                          <Text style={styles.cardRowAmount}>{formatCurrency(b.total)}</Text>
                        </View>
                        <View style={styles.shareTrack}>
                          <View
                            style={[
                              styles.shareFill,
                              { width: `${Math.max(share * 100, 2)}%`, backgroundColor: s?.color ?? NO_CARD_COLOR },
                            ]}
                          />
                        </View>
                        <Text style={styles.cardRowMeta}>
                          {Math.round(share * 100)}% da fatura · {b.installments_count}{' '}
                          {b.installments_count === 1 ? 'parcela' : 'parcelas'}
                        </Text>
                      </View>
                      <Feather
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={darkTheme.textMuted}
                      />
                    </Pressable>

                    {open && (
                      <View style={styles.items}>
                        {b.items.map((item) => (
                          <View key={`${item.series_id}-${item.installment_number}`} style={styles.itemRow}>
                            <View style={[styles.itemDot, { backgroundColor: s?.color ?? NO_CARD_COLOR }]} />
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.description}
                            </Text>
                            <Text style={styles.itemParcel}>
                              {item.installment_number}/{item.installment_count}
                            </Text>
                            <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                          </View>
                        ))}
                        {b.credit_card_id !== null && (
                          <Pressable
                            accessibilityRole="link"
                            hitSlop={6}
                            style={styles.itemsLink}
                            onPress={() =>
                              router.push({
                                pathname: '/invoices',
                                params: {
                                  creditCardId: String(b.credit_card_id),
                                  creditCardName: s?.card.name ?? 'Cartão',
                                },
                              } as never)
                            }
                          >
                            <Text style={styles.itemsLinkText}>Ver faturas deste cartão</Text>
                            <Feather name="arrow-right" size={14} color={darkTheme.accent} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )
              })
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { flex: 1, fontSize: 13, color: darkTheme.textSecondary },
  ranges: {
    flexDirection: 'row',
    backgroundColor: darkTheme.surfaceSecondary,
    borderRadius: 999,
    padding: 2,
  },
  rangeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rangeChipActive: { backgroundColor: darkTheme.primary },
  rangeText: { fontSize: 12, color: darkTheme.textSecondary, fontWeight: '600' },
  rangeTextActive: { color: '#ffffff' },
  total: { fontSize: 28, fontWeight: '700', color: darkTheme.text },
  loading: { opacity: 0.5 },
  hint: { fontSize: 13, lineHeight: 18, color: darkTheme.textMuted },
  chart: { marginTop: 18, height: CHART_HEIGHT + 24 },
  axis: { position: 'absolute', left: 0, right: 0, top: 0, height: CHART_HEIGHT },
  // eixo à direita, fora das barras
  gridLine: {
    position: 'absolute',
    left: 0,
    right: AXIS_WIDTH - 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: darkTheme.border,
  },
  gridLabel: { position: 'absolute', right: -(AXIS_WIDTH - 4), top: -7, fontSize: 10, color: darkTheme.textMuted, width: AXIS_WIDTH - 6, textAlign: 'right' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 24, marginRight: AXIS_WIDTH },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: CHART_HEIGHT, justifyContent: 'flex-end', borderRadius: 8 },
  barTrackSelected: { backgroundColor: 'rgba(167, 139, 250, 0.08)' },
  stack: { width: '100%', overflow: 'hidden', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  month: { fontSize: 12, lineHeight: 16, color: darkTheme.textMuted },
  monthCurrent: { color: darkTheme.accent, fontWeight: '700' },
  legend: { gap: 8, paddingVertical: 8 },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  legendDot: { width: 14, height: 14, borderRadius: 7, marginLeft: 2 },
  legendText: { fontSize: 12, color: darkTheme.text, fontWeight: '500', flexShrink: 1 },
  legendTextOff: { color: darkTheme.textMuted, textDecorationLine: 'line-through' },
  detail: {
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: darkTheme.border,
    paddingTop: 12,
    gap: 4,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.3 },
  detailTitleBox: { flex: 1, alignItems: 'center' },
  detailTitle: { fontSize: 13, color: darkTheme.textSecondary },
  detailTotal: { fontSize: 18, fontWeight: '700', color: darkTheme.text },
  empty: { fontSize: 13, color: darkTheme.textMuted, textAlign: 'center', paddingVertical: 8 },
  cardRowBox: { borderRadius: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  noCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRowInfo: { flex: 1, gap: 5 },
  cardRowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardRowName: { flex: 1, fontSize: 14, fontWeight: '600', color: darkTheme.text },
  cardRowAmount: { fontSize: 14, fontWeight: '600', color: darkTheme.text },
  shareTrack: { height: 4, borderRadius: 2, backgroundColor: darkTheme.surfaceSecondary, overflow: 'hidden' },
  shareFill: { height: 4, borderRadius: 2 },
  cardRowMeta: { fontSize: 11, color: darkTheme.textMuted },
  items: {
    marginLeft: 42,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderColor: darkTheme.border,
    gap: 8,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { flex: 1, fontSize: 13, color: darkTheme.textSecondary },
  itemParcel: { fontSize: 12, color: darkTheme.textMuted },
  itemAmount: { fontSize: 13, color: darkTheme.text, fontWeight: '500', minWidth: 76, textAlign: 'right' },
  itemsLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  itemsLinkText: { fontSize: 13, color: darkTheme.accent, fontWeight: '500' },
})
