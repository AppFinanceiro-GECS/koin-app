import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native'

import { getApiErrorMessage } from '@/lib/errors'
import { memberFirstName } from '@/lib/family'
import { creditCardsApi } from '@/services/accounts.api'
import { familyApi } from '@/services/settings.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface Props {
  card: { id: number; name?: string | null; ownership_type?: string | null; user_id?: number | null }
  /** Avisa a tela quando o cartão muda (por exemplo, para marcar as compras da revisão) */
  onChange?: (household: boolean) => void
}

/**
 * Cartão da casa: todas as compras dele entram na divisão da família, sem marcar uma a uma.
 * Só aparece para quem divide a família com alguém; só o dono do cartão muda.
 */
export function HouseCardToggle({ card, onChange }: Props) {
  const queryClient = useQueryClient()
  const me = useAuthStore((s) => s.user?.id)
  const { data: family } = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })

  const household = card.ownership_type === 'household'
  const isMine = card.user_id == null || card.user_id === me

  const change = useMutation({
    mutationFn: async (next: boolean) =>
      (
        await creditCardsApi.update(card.id, {
          ownership_type: next ? 'household' : 'personal',
          apply_to_open_invoices: true,
        })
      ).data,
    onSuccess: async (data) => {
      onChange?.(data.ownership_type === 'household')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['credit-card', card.id] }),
        queryClient.invalidateQueries({ queryKey: ['family'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
    },
    onError: (err) => Alert.alert('Não foi possível mudar', getApiErrorMessage(err, 'Tente de novo.')),
  })

  if (!family || (family.members?.length ?? 0) < 2) return null

  if (!isMine) {
    if (!household) return null
    const owner = family.members.find((m) => m.user_id === card.user_id)
    return (
      <View style={styles.row}>
        <Feather name="home" size={18} color={darkTheme.accent} />
        <Text style={[styles.text, { flex: 1 }]}>
          Cartão da casa{owner ? ` de ${memberFirstName(owner)}` : ''}: as compras entram na divisão.
        </Text>
      </View>
    )
  }

  const confirm = (next: boolean) => {
    Alert.alert(
      next ? 'Cartão da casa' : 'Voltar a ser pessoal',
      next
        ? 'As compras deste cartão entram na divisão da família, inclusive as das faturas ainda não pagas. A família passa a ver o cartão e as faturas dele.'
        : 'As compras das faturas ainda não pagas voltam a ser só suas e saem da divisão. Faturas pagas ficam como estão.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: next ? 'Marcar como da casa' : 'Tornar pessoal', onPress: () => change.mutate(next) },
      ]
    )
  }

  return (
    <View style={styles.row}>
      <Feather name="home" size={18} color={household ? darkTheme.accent : darkTheme.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Cartão da casa</Text>
        <Text style={styles.text}>
          {household
            ? 'As compras entram na divisão da família.'
            : 'Marque se este cartão paga as despesas da casa.'}
        </Text>
      </View>
      {change.isPending ? (
        <ActivityIndicator color={darkTheme.accent} />
      ) : (
        <Switch
          accessibilityLabel="Cartão da casa"
          value={household}
          onValueChange={confirm}
          trackColor={{ true: darkTheme.primary, false: darkTheme.border }}
          thumbColor="#ffffff"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  title: { fontSize: 15, fontWeight: '600', color: darkTheme.text },
  text: { fontSize: 13, color: darkTheme.textSecondary },
})
