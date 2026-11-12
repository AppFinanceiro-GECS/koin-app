import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'

/**
 * Entrar na família de alguém com o código do convite, para quem já tem conta no Koin.
 * O que é pessoal continua pessoal; só o que for marcado como da família aparece para os outros.
 */
export default function JoinFamilyScreen() {
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ code?: string }>()
  const [code, setCode] = useState(params.code ?? '')

  const join = useMutation({
    mutationFn: async () => (await familyApi.join(code.trim())).data,
    onSuccess: async (data) => {
      queryClient.setQueryData(['family', 'context'], data)
      await queryClient.invalidateQueries({ queryKey: ['family'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      router.back()
    },
    onError: (err) => Alert.alert('Não foi possível entrar', getApiErrorMessage(err, 'Confira o código e tente de novo.')),
  })

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title="Entrar numa família" />
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Feather name="key" size={28} color="#c084fc" />
        </View>
        <Text style={styles.title}>Tem um código de convite?</Text>
        <Text style={styles.subtitle}>
          Peça para quem criou a família convidar o e-mail da sua conta e colar aqui o código que o Koin gerou.
        </Text>

        <TextInput
          accessibilityLabel="Código do convite"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole o código"
          placeholderTextColor={darkTheme.textMuted}
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          disabled={code.trim().length < 6 || join.isPending}
          onPress={() => join.mutate()}
          style={({ pressed }) => [styles.primary, (code.trim().length < 6 || join.isPending) && styles.disabled, pressed && styles.pressed]}
        >
          {join.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryText}>Entrar na família</Text>}
        </Pressable>

        <View style={styles.note}>
          <Feather name="lock" size={14} color={darkTheme.textSecondary} />
          <Text style={styles.noteText}>
            Seus lançamentos pessoais continuam só seus. A família vê só o que você marcar como da casa.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.background },
  content: { padding: 20, gap: 14 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: darkTheme.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: darkTheme.textSecondary, textAlign: 'center' },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 14,
    color: darkTheme.text,
    fontSize: 15,
    marginTop: 8,
  },
  primary: {
    height: 50,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
  noteText: { flex: 1, fontSize: 13, color: darkTheme.textSecondary },
})
