import Feather from '@expo/vector-icons/Feather'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { creditCardLabel } from '@/lib/creditCards'
import { formatCurrency } from '@/lib/format'
import { darkTheme } from '@/theme/colors'
import type { CardMatch, CreditCardListItem } from '@/types/api'

interface Props {
  match: CardMatch | null | undefined
  cards: CreditCardListItem[]
  selectedCardId: number | null
  onSelect: (id: number) => void
  /** Cadastra o cartão sugerido pela fatura (um toque) */
  onCreate: () => void
  /** Abre o formulário preenchido para ajustar antes de cadastrar */
  onAdjust: () => void
  creating?: boolean
}

/**
 * De qual cartão é a fatura. Reconhecido pela API (final e banco); quando o cartão ainda
 * não existe, oferece cadastrar com os dados lidos da própria fatura.
 */
export function InvoiceCardBanner({
  match,
  cards,
  selectedCardId,
  onSelect,
  onCreate,
  onAdjust,
  creating,
}: Props) {
  const selected = cards.find((c) => c.id === selectedCardId)

  const pickCard = (ids?: number[]) => {
    const options = (ids?.length ? cards.filter((c) => ids.includes(c.id)) : cards).filter(
      (c) => c.is_active !== false
    )
    Alert.alert('De qual cartão é esta fatura?', undefined, [
      ...options.map((c) => ({ text: creditCardLabel(c), onPress: () => onSelect(c.id) })),
      ...(match?.status === 'new' ? [{ text: 'Cadastrar o cartão da fatura', onPress: onCreate }] : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ])
  }

  if (selected) {
    return (
      <View style={[styles.box, styles.boxOk]}>
        <View style={[styles.icon, styles.iconOk]}>
          <Feather name="check" size={18} color={darkTheme.success} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.caption}>
            {match?.status === 'matched' && match.credit_card_id === selected.id
              ? 'Reconhecemos o cartão'
              : 'Cartão da fatura'}
          </Text>
          <Text style={styles.title}>{creditCardLabel(selected)}</Text>
        </View>
        {cards.length > 1 && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => pickCard()}>
            <Text style={styles.link}>Trocar</Text>
          </Pressable>
        )}
      </View>
    )
  }

  if (match?.status === 'new' && match.suggestion) {
    const s = match.suggestion
    const details = [
      s.closing_day ? `fecha dia ${s.closing_day}` : null,
      s.due_day ? `vence dia ${s.due_day}` : null,
      s.credit_limit ? `limite ${formatCurrency(s.credit_limit)}` : null,
    ].filter(Boolean)
    const complete = Boolean(s.closing_day && s.due_day)
    return (
      <View style={[styles.box, styles.boxNew]}>
        <View style={styles.row}>
          <View style={[styles.icon, styles.iconNew]}>
            <Feather name="credit-card" size={18} color={darkTheme.accent} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.caption}>Cartão novo encontrado na fatura</Text>
            <Text style={styles.title}>
              {s.name}
              {s.last_four_digits ? ` final ${s.last_four_digits}` : ''}
            </Text>
            {details.length > 0 && <Text style={styles.details}>{details.join(' · ')}</Text>}
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={creating}
            onPress={complete ? onCreate : onAdjust}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryText}>{complete ? 'Cadastrar este cartão' : 'Completar e cadastrar'}</Text>
            )}
          </Pressable>
          {complete && (
            <Pressable accessibilityRole="button" onPress={onAdjust} style={styles.secondary}>
              <Text style={styles.link}>Ajustar</Text>
            </Pressable>
          )}
        </View>
        {cards.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => pickCard()}>
            <Text style={[styles.link, styles.linkSmall]}>É de um cartão que já cadastrei</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (cards.length ? pickCard(match?.candidate_ids) : onAdjust())}
      style={({ pressed }) => [styles.box, styles.boxWarn, pressed && styles.pressed]}
    >
      <View style={[styles.icon, styles.iconWarn]}>
        <Feather name="help-circle" size={18} color={darkTheme.warning} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.caption}>
          {match?.status === 'ambiguous' ? 'Mais de um cartão combina' : 'Não identificamos o cartão'}
        </Text>
        <Text style={styles.title}>{cards.length ? 'Escolha o cartão desta fatura' : 'Cadastre o cartão desta fatura'}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxOk: { backgroundColor: darkTheme.surface, borderColor: darkTheme.border },
  boxNew: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: darkTheme.primary,
  },
  boxWarn: { backgroundColor: darkTheme.warningBackground, borderColor: darkTheme.warningBorder },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconOk: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  iconNew: { backgroundColor: 'rgba(124, 58, 237, 0.25)' },
  iconWarn: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  texts: { flex: 1, gap: 2 },
  caption: { fontSize: 12, color: darkTheme.textSecondary },
  title: { fontSize: 15, fontWeight: '600', color: darkTheme.text },
  details: { fontSize: 13, color: darkTheme.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  secondary: { paddingHorizontal: 8, height: 44, justifyContent: 'center' },
  link: { color: darkTheme.accent, fontSize: 14, fontWeight: '600' },
  linkSmall: { fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.75 },
})
