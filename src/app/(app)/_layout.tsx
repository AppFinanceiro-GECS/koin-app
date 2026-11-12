import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'

import { hasSeenOnboarding } from '@/lib/onboarding'
import { authApi } from '@/services/auth.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

export default function AppLayout() {
  const setUser = useAuthStore((s) => s.setUser)
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await authApi.me()).data,
  })

  useEffect(() => {
    if (user) setUser(user)
  }, [user, setUser])

  // Primeiro acesso de cada usuário neste aparelho: tutorial antes do Início
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    hasSeenOnboarding(userId).then((seen) => {
      if (!seen && !cancelled) router.replace('/onboarding')
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: darkTheme.background },
        headerTintColor: darkTheme.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: darkTheme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="installments" options={{ headerShown: false }} />
      <Stack.Screen name="invoices" options={{ headerShown: false }} />
      <Stack.Screen name="monthly-summary" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
      <Stack.Screen name="family/index" options={{ headerShown: false }} />
      <Stack.Screen name="family/invite" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="transaction/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="invoice/duplicate" options={{ headerShown: false }} />
      <Stack.Screen name="invoice/import" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="account/modal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="credit-card/modal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="credit-card/[id]/invoice" options={{ headerShown: false }} />
    </Stack>
  )
}
