import { Feather } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getApiErrorMessage } from '@/lib/errors'
import { leaveEventFlow } from '@/lib/event'
import { eventApi } from '@/services/event.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now.toLocaleTimeString('pt-BR')
}

/**
 * Tela para mostrar no stand. O relógio e o anel animado mostram que é a tela ao vivo,
 * não um print. A equipe segura o botão para registrar o bombom (um por conta).
 */
export default function EventStandScreen() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const clock = useClock()
  const [pulse] = useState(() => new Animated.Value(0))

  const status = useQuery({
    queryKey: ['event-signup'],
    queryFn: async () => (await eventApi.status()).data,
  })

  const gift = useMutation({
    mutationFn: async () => (await eventApi.deliverGift()).data,
    onSuccess: (data) => queryClient.setQueryData(['event-signup'], data),
  })

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const data = status.data
  const delivered = data?.gift_delivered

  if (status.isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={darkTheme.accent} />
      </SafeAreaView>
    )
  }

  if (!data || !data.email_verified) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, styles.padded]}>
        <Text style={styles.title}>Falta confirmar o e-mail</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/event/verify')}>
          <Text style={styles.primaryButtonText}>Confirmar agora</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const ticket = `#${String(data.ticket_number).padStart(3, '0')}`
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.content, styles.padded]}>
        <Text style={styles.kicker}>{delivered ? 'Obrigado por testar o Koin!' : 'Mostre esta tela no stand'}</Text>

        <Animated.View style={[styles.ringWrap, { transform: [{ scale }], opacity: delivered ? 1 : opacity }]}>
          <LinearGradient
            colors={delivered ? [darkTheme.success, darkTheme.successBorder] : [darkTheme.primary, darkTheme.accent]}
            style={styles.ring}
          >
            <View style={styles.ringInner}>
              {delivered ? (
                <Feather name="check" size={64} color={darkTheme.success} />
              ) : (
                <Text style={styles.emoji}>🍫</Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.ticket}>Cadastro {ticket}</Text>
        <Text style={styles.clock}>{clock}</Text>

        <View style={styles.badge}>
          <Feather name="check-circle" size={16} color={darkTheme.success} />
          <Text style={styles.badgeText}>E-mail confirmado</Text>
        </View>

        {delivered ? (
          <Text style={styles.deliveredText}>Bombom entregue 🍫</Text>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.staffButton, pressed && styles.staffButtonPressed]}
              delayLongPress={1200}
              onLongPress={() => gift.mutate()}
              disabled={gift.isPending}
              accessibilityRole="button"
              accessibilityLabel="Equipe: segure para entregar o bombom"
            >
              {gift.isPending ? (
                <ActivityIndicator color={darkTheme.text} />
              ) : (
                <Text style={styles.staffButtonText}>Equipe: segure para entregar</Text>
              )}
            </Pressable>
            {gift.error ? (
              <Text style={styles.error}>{getApiErrorMessage(gift.error, 'Não deu certo, tente de novo')}</Text>
            ) : null}
          </>
        )}

        <Pressable style={styles.linkButton} onPress={() => leaveEventFlow(user?.id)}>
          <Text style={styles.linkText}>Continuar para o app</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkTheme.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  padded: { paddingHorizontal: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  kicker: { fontSize: 20, fontWeight: '600', color: darkTheme.text, textAlign: 'center', marginBottom: 12 },
  ringWrap: { marginBottom: 12 },
  ring: { width: 190, height: 190, borderRadius: 95, padding: 8 },
  ringInner: {
    flex: 1,
    borderRadius: 90,
    backgroundColor: darkTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 72 },
  name: { fontSize: 28, fontWeight: '700', color: darkTheme.text, textAlign: 'center' },
  ticket: { fontSize: 18, color: darkTheme.accentLight, fontWeight: '600' },
  clock: { fontSize: 16, color: darkTheme.textSecondary, fontVariant: ['tabular-nums'] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: darkTheme.successBackground,
    borderColor: darkTheme.successBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
  },
  badgeText: { color: darkTheme.success, fontSize: 13, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '600', color: darkTheme.text, textAlign: 'center' },
  primaryButton: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  staffButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  staffButtonPressed: { borderColor: darkTheme.accent },
  staffButtonText: { fontSize: 15, fontWeight: '600', color: darkTheme.textSecondary },
  deliveredText: { fontSize: 18, fontWeight: '600', color: darkTheme.success, marginTop: 8 },
  error: { color: darkTheme.error, fontSize: 13, textAlign: 'center' },
  linkButton: { paddingVertical: 12 },
  linkText: { fontSize: 15, color: darkTheme.accent, fontWeight: '500' },
})
