import Feather from '@expo/vector-icons/Feather'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { creditCardLabel } from '@/lib/creditCards'
import { darkTheme } from '@/theme/colors'
import type { CardMatch, CreditCardListItem } from '@/types/api'

interface Props {
  match: CardMatch | null | undefined
  cards: CreditCardListItem[]
  /** Cartão em que a compra vai entrar (reconhecido pelo final ou escolhido) */
  card: CreditCardListItem | undefined
  /** Final lido no comprovante */
  digits: string | null | undefined
  /** false quando a pessoa disse que a compra não foi no cartão */
  useCard: boolean
  onUseCard: (use: boolean) => void
  onSelect: (id: number) => void
  /** Abre o formulário do cartão preenchido com o que o comprovante traz */
  onRegister: () => void
}

/**
 * De qual cartão é a compra do comprovante. Só reconhece pelo final; sem cartão com esse final,
 * pergunta se a pessoa quer cadastrar. O comprovante nunca cria cartão sozinho.
 */
export function ReceiptCardBanner({ match, cards, card, digits, useCard, onUseCard, onSelect, onRegister }: Props) {
  if (card && useCard) {
    return (
      <View style={[styles.box, styles.boxOk]}>
        <View style={[styles.icon, styles.iconOk]}>
          <Feather name="credit-card" size={18} color={darkTheme.success} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.caption}>Compra no cartão · entra na fatura</Text>
          <Text style={styles.title}>{creditCardLabel(card)}</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onUseCard(false)}>
          <Text style={styles.link}>Não foi nele</Text>
        </Pressable>
      </View>
    )
  }

  if (card && !useCard) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onUseCard(true)}
        style={({ pressed }) => [styles.box, styles.boxOk, pressed && styles.pressed]}
      >
        <View style={styles.texts}>
          <Text style={styles.caption}>Lançando numa conta comum</Text>
          <Text style={styles.link}>Foi no {creditCardLabel(card)}? Lançar no cartão</Text>
        </View>
      </Pressable>
    )
  }

  if (match?.status === 'ambiguous' && match.candidate_ids.length > 0) {
    const options = cards.filter((c) => match.candidate_ids.includes(c.id))
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert('Em qual cartão foi a compra?', undefined, [
            ...options.map((c) => ({ text: creditCardLabel(c), onPress: () => onSelect(c.id) })),
            { text: 'Cancelar', style: 'cancel' as const },
          ])
        }
        style={({ pressed }) => [styles.box, styles.boxWarn, pressed && styles.pressed]}
      >
        <View style={[styles.icon, styles.iconWarn]}>
          <Feather name="help-circle" size={18} color={darkTheme.warning} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.caption}>Mais de um cartão com o final {digits}</Text>
          <Text style={styles.title}>Escolha o cartão da compra</Text>
        </View>
        <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
      </Pressable>
    )
  }

  if (match?.status === 'unregistered' && digits) {
    return (
      <View style={[styles.box, styles.boxNew]}>
        <View style={styles.row}>
          <View style={[styles.icon, styles.iconNew]}>
            <Feather name="credit-card" size={18} color={darkTheme.accent} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.caption}>Compra no cartão final {digits}</Text>
            <Text style={styles.title}>Cadastrar o cartão final {digits}?</Text>
            <Text style={styles.details}>
              Cadastrado, a compra entra na fatura dele. Sem cadastrar, ela entra na conta escolhida abaixo.
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onRegister}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Cadastrar cartão final {digits}</Text>
        </Pressable>
      </View>
    )
  }

  return null
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
  primary: {
    height: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  link: { color: darkTheme.accent, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.75 },
})
