import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { EVENT_CODE } from '@/lib/event'
import { eventApi } from '@/services/event.api'
import { darkTheme } from '@/theme/colors'

/**
 * Lembrete no Início para quem se cadastrou no stand e ainda não retirou o bombom.
 * Só existe no build do evento (EXPO_PUBLIC_EVENT_CODE); conta de fora do evento recebe 404 e some.
 */
export function EventGiftCard() {
  const { data } = useQuery({
    queryKey: ['event-signup'],
    queryFn: async () => (await eventApi.status()).data,
    enabled: Boolean(EVENT_CODE),
    retry: false,
  })

  if (!data || data.gift_delivered) return null

  const verified = data.email_verified
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(verified ? '/event/stand' : '/event/verify')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>🍫</Text>
      <View style={styles.texts}>
        <Text style={styles.title}>
          {verified ? 'Seu bombom está esperando' : 'Falta pouco para o seu bombom'}
        </Text>
        <Text style={styles.subtitle}>
          {verified ? 'Mostre a tela no stand para retirar.' : 'Confirme o código que chegou no seu e-mail.'}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={darkTheme.textSecondary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: darkTheme.borderFocus,
    backgroundColor: darkTheme.surfaceSecondary,
  },
  pressed: { opacity: 0.8 },
  emoji: { fontSize: 28 },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: darkTheme.text },
  subtitle: { fontSize: 13, color: darkTheme.textSecondary },
})
