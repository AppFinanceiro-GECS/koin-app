import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SvgXml } from 'react-native-svg'

import { BankLogo } from '@/components/BankLogo'
import { cardBrandLogo, resolveBank, shade, withAlpha } from '@/lib/banks'
import { formatCurrency } from '@/lib/format'
import type { CreditCardListItem } from '@/types/api'

interface Props {
  card: CreditCardListItem
  onPress: () => void
  onEdit?: () => void
  /** largura fixa (carrossel da Início); sem ela ocupa a linha toda */
  width?: number
}

/** O cartão de crédito com a cor e o logo do banco: o mesmo desenho na Início e na aba Cartões */
export function BankCardTile({ card, onPress, onEdit, width }: Props) {
  const bank = resolveBank(card)
  const nickname = card.nickname?.trim() || card.name?.trim() || bank.shortName
  const limit = Number(card.credit_limit) || 0
  const used = Math.max(Number(card.current_balance) || 0, 0)
  const available = Math.max(Number(card.available_limit) || 0, 0)
  const usage = limit > 0 ? Math.min(used / limit, 1) : 0
  const inactive = card.is_active === false
  // a bandeira já aparece no lugar do logo quando o banco não é conhecido
  const brandLogo = bank.id === 'other' ? null : cardBrandLogo(card.card_brand)
  const fg = bank.onColor
  const fgSoft = withAlpha(fg === '#ffffff' ? '#ffffff' : '#111111', 0.72)
  const label = `${nickname}${card.last_four_digits ? ` final ${card.last_four_digits}` : ''}`

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Faturas do cartão ${label}`}
      onPress={onPress}
      style={({ pressed }) => [width ? { width } : null, pressed && styles.pressed, inactive && styles.inactive]}
    >
      <LinearGradient
        colors={[shade(bank.color, 0.08), bank.color, shade(bank.color, -0.45)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        {/* brilho sutil no canto, como num cartão de plástico */}
        <View style={[styles.glow, { backgroundColor: withAlpha('#ffffff', 0.08) }]} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.logoRing}>
            <BankLogo bank={bank} size={30} />
          </View>
          <View style={styles.titleBox}>
            <Text style={[styles.name, { color: fg }]} numberOfLines={1}>
              {nickname}
            </Text>
            <Text style={[styles.meta, { color: fgSoft }]} numberOfLines={1}>
              {inactive ? 'Desativado · ' : ''}
              {bank.id !== 'other' && bank.shortName.toLowerCase() !== nickname.toLowerCase() ? `${bank.shortName} · ` : ''}
              vence dia {card.due_day}
            </Text>
          </View>
          {onEdit && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ou excluir ${label}`}
              hitSlop={10}
              onPress={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Ionicons name="pencil" size={14} color={fg} />
            </Pressable>
          )}
        </View>

        <View style={styles.amountBox}>
          <Text style={[styles.amountLabel, { color: fgSoft }]}>{used > 0 ? 'Fatura em aberto' : 'Nada em aberto'}</Text>
          <Text style={[styles.amount, { color: fg }]}>{formatCurrency(used)}</Text>
        </View>

        {limit > 0 && (
          <View style={styles.limitBox}>
            <View style={[styles.track, { backgroundColor: withAlpha(fg, 0.22) }]}>
              <View style={[styles.fill, { width: `${Math.max(usage * 100, used > 0 ? 3 : 0)}%`, backgroundColor: fg }]} />
            </View>
            <Text style={[styles.limitText, { color: fgSoft }]} numberOfLines={1}>
              {formatCurrency(available)} livres de {formatCurrency(limit)}
            </Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <Text style={[styles.digits, { color: fgSoft }]}>
            {card.last_four_digits ? `•••• ${card.last_four_digits}` : ' '}
          </Text>
          {brandLogo && (
            <View style={styles.brand}>
              <SvgXml xml={brandLogo} width={38} height={24} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.55 },
  tile: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    minHeight: 178,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    right: -70,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: { flex: 1, gap: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBox: { gap: 1 },
  amountLabel: { fontSize: 12 },
  amount: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  limitBox: { gap: 5 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  limitText: { fontSize: 11 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  digits: { fontSize: 13, letterSpacing: 1.5, fontWeight: '600' },
  brand: { alignItems: 'flex-end' },
})
