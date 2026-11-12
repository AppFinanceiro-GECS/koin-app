import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { memberFirstName } from '@/lib/family'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'

const PRESETS_TWO = [
  [50, 50],
  [60, 40],
  [70, 30],
]

const parse = (text: string) => Number(text.replace(',', '.')) || 0

/**
 * Como dividir as despesas da casa: partes iguais ou porcentagem de cada um
 * (por exemplo, proporcional à renda). Só o dono da família muda.
 */
export default function FamilySharesScreen() {
  const queryClient = useQueryClient()
  const { data: family, isLoading } = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
  })
  const members = family?.members ?? []
  // o que a pessoa digitou; sem edição, vale a parte salva (ou a igual)
  const [edited, setValues] = useState<Record<number, string>>({})
  // renda de cada um, para calcular a parte proporcional
  const [incomes, setIncomes] = useState<Record<number, string>>({})

  const equal = members.length ? 100 / members.length : 0
  const values: Record<number, string> = Object.fromEntries(
    members.map((m) => [m.id, edited[m.id] ?? String(Math.round((m.share_percent ?? equal) * 100) / 100)])
  )

  const total = members.reduce((sum, m) => sum + parse(values[m.id] ?? '0'), 0)
  const valid = Math.abs(total - 100) <= 0.01

  const save = useMutation({
    mutationFn: async (equal: boolean) =>
      (
        await familyApi.updateShares(
          equal ? [] : members.map((m) => ({ member_id: m.id, share_percent: parse(values[m.id] ?? '0') }))
        )
      ).data,
    onSuccess: async (data) => {
      queryClient.setQueryData(['family', 'context'], data)
      await queryClient.invalidateQueries({ queryKey: ['family', 'split'] })
      router.back()
    },
    onError: (err) => Alert.alert('Não foi possível salvar', getApiErrorMessage(err, 'Tente de novo.')),
  })

  const applyIncomes = () => {
    const amounts = members.map((m) => parse(incomes[m.id] ?? '0'))
    const sum = amounts.reduce((a, b) => a + b, 0)
    if (sum <= 0) {
      Alert.alert('Informe as rendas', 'Preencha a renda mensal de cada um para calcular a proporção.')
      return
    }
    // arredonda em 0,01 e joga a sobra no primeiro, para somar exatamente 100
    const parts = amounts.map((a) => Math.round((a / sum) * 10000) / 100)
    parts[0] = Math.round((100 - parts.slice(1).reduce((a, b) => a + b, 0)) * 100) / 100
    setValues(Object.fromEntries(members.map((m, i) => [m.id, String(parts[i])])))
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title="Como dividir" />
      {isLoading || !family ? (
        <ActivityIndicator color={darkTheme.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Vale para as despesas marcadas como da família. O Koin calcula quanto cada um pagou e quem deve a quem.
          </Text>
          {!family.is_owner && (
            <Text style={styles.ownerNote}>Só quem criou a família muda a divisão. Você pode simular aqui.</Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={!family.is_owner}
            onPress={() => save.mutate(true)}
            style={({ pressed }) => [styles.option, family.members.every((m) => m.share_percent == null) && styles.optionActive, pressed && styles.pressed]}
          >
            <Text style={styles.optionTitle}>Partes iguais</Text>
            <Text style={styles.muted}>Cada um fica com {Math.round(10000 / members.length) / 100}%</Text>
          </Pressable>

          <View style={[styles.option, family.members.some((m) => m.share_percent != null) && styles.optionActive]}>
            <Text style={styles.optionTitle}>Proporcional</Text>
            <Text style={styles.muted}>Por exemplo, de acordo com a renda de cada um</Text>

            {members.length === 2 && (
              <View style={styles.presets}>
                {PRESETS_TWO.map(([a, b]) => (
                  <Pressable
                    key={`${a}-${b}`}
                    onPress={() => setValues({ [members[0].id]: String(a), [members[1].id]: String(b) })}
                    style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                  >
                    <Text style={styles.chipText}>
                      {a}/{b}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <Text style={styles.memberName}>{memberFirstName(m)}</Text>
                <TextInput
                  accessibilityLabel={`Renda de ${memberFirstName(m)}`}
                  placeholder="Renda"
                  placeholderTextColor={darkTheme.textMuted}
                  keyboardType="decimal-pad"
                  value={incomes[m.id] ?? ''}
                  onChangeText={(t) => setIncomes((prev) => ({ ...prev, [m.id]: t }))}
                  style={[styles.input, styles.incomeInput]}
                />
                <TextInput
                  accessibilityLabel={`Parte de ${memberFirstName(m)} em porcentagem`}
                  keyboardType="decimal-pad"
                  value={values[m.id] ?? ''}
                  onChangeText={(t) => setValues((prev) => ({ ...values, ...prev, [m.id]: t }))}
                  style={[styles.input, styles.percentInput]}
                />
                <Text style={styles.muted}>%</Text>
              </View>
            ))}

            <Pressable onPress={applyIncomes}>
              <Text style={styles.link}>Calcular pela renda</Text>
            </Pressable>
            <Text style={[styles.muted, !valid && styles.error]}>
              Soma: {Math.round(total * 100) / 100}% {valid ? '' : '(precisa dar 100%)'}
            </Text>

            {family.is_owner && (
            <Pressable
              accessibilityRole="button"
              disabled={!valid || save.isPending}
              onPress={() => save.mutate(false)}
              style={({ pressed }) => [styles.primary, (!valid || save.isPending) && styles.disabled, pressed && styles.pressed]}
            >
              {save.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryText}>Salvar divisão proporcional</Text>
              )}
            </Pressable>
            )}
          </View>

          <Text style={styles.footnote}>A renda é usada só para calcular a porcentagem e não é salva.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: darkTheme.textSecondary },
  ownerNote: {
    fontSize: 13,
    color: darkTheme.warning,
    padding: 12,
    borderRadius: 12,
    backgroundColor: darkTheme.warningBackground,
  },
  option: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    gap: 10,
  },
  optionActive: { borderColor: darkTheme.primary },
  optionTitle: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  muted: { fontSize: 13, color: darkTheme.textSecondary },
  error: { color: darkTheme.warning },
  presets: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  chipText: { color: darkTheme.text, fontWeight: '600' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { flex: 1, fontSize: 15, color: darkTheme.text },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.border,
    paddingHorizontal: 10,
    color: darkTheme.text,
    backgroundColor: darkTheme.background,
  },
  incomeInput: { width: 110 },
  percentInput: { width: 70, textAlign: 'right' },
  link: { color: darkTheme.accent, fontWeight: '600', fontSize: 14 },
  primary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
  footnote: { fontSize: 12, color: darkTheme.textMuted, textAlign: 'center' },
})
