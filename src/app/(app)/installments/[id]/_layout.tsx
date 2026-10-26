import { Stack } from 'expo-router'

export default function DetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="advance/index" />
      <Stack.Screen name="advance/review" />
      <Stack.Screen name="advance/confirm" />
      <Stack.Screen name="edit/index" />
      <Stack.Screen name="edit/confirm" />
    </Stack>
  )
}
