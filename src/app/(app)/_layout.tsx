import { useQuery } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect } from 'react'

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

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: darkTheme.surface },
        headerTintColor: darkTheme.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: darkTheme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="monthly-summary" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
      <Stack.Screen name="family/index" options={{ headerShown: false }} />
      <Stack.Screen name="family/invite" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="transaction/new" options={{ title: 'Nova transação', presentation: 'modal' }} />
      <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="invoice/import" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="account/modal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="credit-card/modal" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  )
}
