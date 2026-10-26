import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useAuthStore } from '@/stores/authStore'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function RootLayout() {
  const status = useAuthStore((s) => s.status)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync()
    // Não deixar dados de um usuário no cache depois do logout
    if (status === 'signedOut') queryClient.clear()
  }, [status])

  if (status === 'loading') return null

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          {/* Sem guard: aparece logo depois da exclusão, quando a sessão já foi encerrada. */}
          <Stack.Screen name="account-deleted" options={{ gestureEnabled: false }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
