import { Stack } from 'expo-router'

import { darkTheme } from '@/theme/colors'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkTheme.background },
      }}
    />
  )
}
