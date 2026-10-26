import Feather from '@expo/vector-icons/Feather'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme } from '@/theme/colors'

// Type matching expo-router / react-navigation bottom tabs
interface TabRoute {
  key: string
  name: string
}

interface KoinTabBarProps {
  state: {
    index: number
    routes: TabRoute[]
  }
  descriptors: Record<string, unknown>
  emitter?: {
    emit: (event: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean }
  }
  navigateToTab?: (routeKey: string) => void
  navigation?: {
    navigate: (name: string) => void
  }
}

interface TabConfig {
  name: string
  label: string
  icon: keyof typeof Feather.glyphMap
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { name: 'index', label: 'Início', icon: 'home' },
  accounts: { name: 'accounts', label: 'Cartões', icon: 'credit-card' },
  transactions: { name: 'transactions', label: 'Movimentação', icon: 'list' },
  profile: { name: 'profile', label: 'Mais', icon: 'menu' },
}

export function KoinTabBar(props: KoinTabBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { state, emitter, navigateToTab, navigation } = props

  const routes = state.routes
  const leftRoutes = routes.filter((r) => r.name === 'index' || r.name === 'accounts')
  const rightRoutes = routes.filter((r) => r.name === 'transactions' || r.name === 'profile')

  const handleTabPress = (routeKey: string, routeName: string, isFocused: boolean) => {
    const event = emitter?.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    })

    if (!isFocused && !event?.defaultPrevented) {
      if (navigateToTab) {
        navigateToTab(routeKey)
      } else if (navigation) {
        navigation.navigate(routeName)
      }
    }
  }

  const renderTabItem = (route: TabRoute) => {
    const routeIndex = routes.findIndex((r) => r.key === route.key)
    const isFocused = state.index === routeIndex
    const config = TAB_CONFIGS[route.name] ?? {
      name: route.name,
      label: route.name,
      icon: 'circle' as keyof typeof Feather.glyphMap,
    }

    const color = isFocused ? darkTheme.accent : darkTheme.textSecondary

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={config.label}
        style={styles.tabItem}
        onPress={() => handleTabPress(route.key, route.name, isFocused)}
      >
        <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
          <Feather name={config.icon} size={20} color={color} />
        </View>
        <Text style={[styles.tabLabel, { color }, isFocused && styles.tabLabelActive]} numberOfLines={1}>
          {config.label}
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBarInner}>
        {leftRoutes.map(renderTabItem)}

        {/* Central Action FAB */}
        <View style={styles.fabWrapper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar movimentação"
            onPress={() => router.push('/transaction/new')}
            style={({ pressed }) => [styles.fabButton, pressed && styles.fabPressed]}
          >
            <LinearGradient
              colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.fabGradient}
            >
              <Feather name="plus" size={24} color="#ddd6fe" />
            </LinearGradient>
          </Pressable>
        </View>

        {rightRoutes.map(renderTabItem)}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#120e1e',
    borderTopWidth: 1,
    borderTopColor: '#2b233c',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 56,
  },
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#271b40',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#7952bc',
    overflow: 'hidden',
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

