import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, monthName } from '@/lib/format'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'
import type { FamilySplit, FamilyTransfer } from '@/types/api'

interface Props {
  split: FamilySplit | undefined
  loading: boolean
  error: unknown
  isOwner: boolean
  onRetry: () => void
}

const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')}%`

/**
 * Divisão do mês: quanto cada um pagou das despesas da casa, a parte de cada um e quem
 * deve a quem. "Acertar" registra o Pix feito por fora e zera o saldo.
 */
export function FamilySplitCard({ split, loading, error, isOwner, onRetry }: Props) {
  const queryClient = useQueryClient()

  const settle = useMutation({
    mutationFn: async (t: FamilyTransfer) =>
      (
        await familyApi.settle({
          from_user_id: t.from_user_id,
          to_user_id: t.to_user_id,
          amount: t.amount,
          year: split!.year,
          month: split!.month,
        })
      ).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['family', 'split', data.year, data.month], data)
    },
    onError: (err) => Alert.alert('Não foi possível registrar', getApiErrorMessage(err, 'Tente de novo.')),
  })

  const undo = useMutation({
    mutationFn: async (id: number) => familyApi.undoSettlement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family', 'split'] }),
    onError: (err) => Alert.alert('Não foi possível desfazer', getApiErrorMessage(err, 'Tente de novo.')),
  })

  const meId = split?.members.find((m) => m.is_me)?.user_id
  // "você" no lugar do próprio nome
  const who = (userId: number, name: string, lower = false) =>
    userId === meId ? (lower ? 'você' : 'Você') : name

  const confirmSettle = (t: FamilyTransfer) => {
    const from = who(t.from_user_id, t.from_name)
    Alert.alert(
      'Registrar acerto',
      `${from} já pagou ${formatCurrency(t.amount)} para ${who(t.to_user_id, t.to_name, true)}? Faça o Pix pelo banco e registre aqui.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Já paguei', onPress: () => settle.mutate(t) },
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color={darkTheme.accent} />
      </View>
    )
  }
  if (error || !split) {
    return (
      <Pressable onPress={onRetry} style={[styles.card, styles.center]}>
        <Text style={styles.muted}>{getApiErrorMessage(error, 'Não foi possível calcular a divisão')}</Text>
        <Text style={styles.link}>Tentar de novo</Text>
      </Pressable>
    )
  }

  const nameOf = (userId: number, lower = false) =>
    who(userId, split.members.find((m) => m.user_id === userId)?.name ?? 'Membro', lower)
  const alone = split.members.length < 2

  return (
    <LinearGradient
      colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.caption}>Despesas da casa em {monthName(split.month)}</Text>
          <Text style={styles.total}>{formatCurrency(split.total)}</Text>
        </View>
        {split.total > 0 && !alone && (
          <View style={[styles.badge, split.is_settled ? styles.badgeOk : styles.badgeWarn]}>
            <Feather
              name={split.is_settled ? 'check' : 'repeat'}
              size={12}
              color={split.is_settled ? darkTheme.success : darkTheme.warning}
            />
            <Text style={[styles.badgeText, { color: split.is_settled ? darkTheme.success : darkTheme.warning }]}>
              {split.is_settled ? 'Acertado' : 'A acertar'}
            </Text>
          </View>
        )}
      </View>

      {/* Quem pagou o quê */}
      <View style={styles.members}>
        {split.members.map((m) => {
          const receives = m.balance >= 0.01
          const pays = m.balance <= -0.01
          return (
            <View key={m.user_id} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{m.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>
                  {m.name}
                  {m.is_me ? ' (você)' : ''}
                </Text>
                <Text style={styles.muted}>
                  Pagou {formatCurrency(m.paid)} · parte {percent(m.share_percent)} ({formatCurrency(m.fair_share)})
                </Text>
              </View>
              <Text style={[styles.balance, receives && styles.positive, pays && styles.negative]}>
                {receives ? `recebe ${formatCurrency(m.balance)}` : pays ? `paga ${formatCurrency(-m.balance)}` : 'em dia'}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Quem deve a quem */}
      {split.transfers.map((t) => (
        <View key={`${t.from_user_id}-${t.to_user_id}`} style={styles.transfer}>
          <Feather name="arrow-right-circle" size={18} color={darkTheme.accent} />
          <Text style={styles.transferText}>
            <Text style={styles.bold}>{who(t.from_user_id, t.from_name)}</Text> paga{' '}
            <Text style={styles.bold}>{formatCurrency(t.amount)}</Text> para{' '}
            <Text style={styles.bold}>{who(t.to_user_id, t.to_name, true)}</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Acertar ${formatCurrency(t.amount)} de ${t.from_name} para ${t.to_name}`}
            disabled={settle.isPending}
            onPress={() => confirmSettle(t)}
            style={({ pressed }) => [styles.settleButton, pressed && styles.pressed]}
          >
            {settle.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.settleText}>Acertar</Text>
            )}
          </Pressable>
        </View>
      ))}

      {alone ? (
        <Text style={styles.hint}>Convide quem divide as contas com você para ver quem pagou o quê.</Text>
      ) : split.total === 0 ? (
        <Text style={styles.hint}>
          Marque lançamentos como da família (ou importe a fatura de um cartão da casa) para dividir.
        </Text>
      ) : split.is_settled ? (
        <Text style={styles.hint}>Tudo certo: ninguém deve nada neste mês.</Text>
      ) : null}

      {/* Acertos registrados */}
      {split.settlements.map((s) => (
        <View key={s.id} style={styles.settledRow}>
          <Feather name="check-circle" size={14} color={darkTheme.success} />
          <Text style={styles.settledText}>
            {nameOf(s.from_user_id)} pagou {formatCurrency(s.amount)} para {nameOf(s.to_user_id, true)}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() =>
              Alert.alert('Desfazer acerto?', 'O saldo volta a aparecer como pendente.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Desfazer', style: 'destructive', onPress: () => undo.mutate(s.id) },
              ])
            }
          >
            <Text style={styles.undo}>Desfazer</Text>
          </Pressable>
        </View>
      ))}

      {!alone && (
        <Pressable
          accessibilityRole="button"
          onPress={() => (isOwner ? router.push('/family/shares') : Alert.alert('Como dividir', 'Quem criou a família define a parte de cada um.'))}
          style={styles.footer}
        >
          <Feather name="sliders" size={14} color={darkTheme.accent} />
          <Text style={styles.link}>
            {split.split_mode === 'custom' ? 'Divisão proporcional' : 'Divisão igual'}
            {isOwner ? ' · mudar' : ''}
          </Text>
        </Pressable>
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120, backgroundColor: darkTheme.surface },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  caption: { fontSize: 13, color: darkTheme.textSecondary },
  total: { fontSize: 28, fontWeight: '700', color: darkTheme.text, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeOk: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  badgeWarn: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  members: { gap: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#e9d5ff', fontWeight: '700', fontSize: 15 },
  memberName: { fontSize: 15, fontWeight: '600', color: darkTheme.text },
  muted: { fontSize: 12, color: darkTheme.textSecondary },
  balance: { fontSize: 13, fontWeight: '600', color: darkTheme.textSecondary, textAlign: 'right', maxWidth: 120 },
  positive: { color: darkTheme.success },
  negative: { color: darkTheme.warning },
  transfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
  },
  transferText: { flex: 1, fontSize: 14, color: darkTheme.text },
  bold: { fontWeight: '700' },
  settleButton: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 13, color: darkTheme.textSecondary },
  settledRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settledText: { flex: 1, fontSize: 13, color: darkTheme.textSecondary },
  undo: { fontSize: 13, color: darkTheme.accent },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: 13, fontWeight: '600', color: darkTheme.accent },
  pressed: { opacity: 0.75 },
})
