import { Tabs } from 'expo-router'

import { KoinTabBar } from '@/components/KoinTabBar'
import { darkTheme } from '@/theme/colors'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <KoinTabBar {...(props as any)} />}
      screenOptions={{
        headerStyle: { backgroundColor: darkTheme.background },
        headerTintColor: darkTheme.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: darkTheme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', headerShown: false }} />
      <Tabs.Screen name="accounts" options={{ title: 'Cartões', headerShown: false }} />
      <Tabs.Screen name="transactions" options={{ title: 'Movimentação', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Mais', headerShown: false }} />
    </Tabs>
  )
}
