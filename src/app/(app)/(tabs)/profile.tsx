import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { APP_VERSION } from '@/lib/config'
import { notificationsApi } from '@/services/settings.api'
import { installmentsApi } from '@/services/transactions.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap
  title: string
  subtitle: string
  onPress: () => void
  badgeCount?: number
}

function MenuItem({ icon, title, subtitle, onPress, badgeCount }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <View style={styles.menuIconWrapper}>
        <Feather name={icon} size={20} color={darkTheme.accent} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
    </Pressable>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data.unread_count,
    staleTime: 30_000,
  })

  const installmentsQuery = useQuery({
    queryKey: ['installments', 'count'],
    queryFn: async () => {
      const res = await installmentsApi.list({ limit: 100 })
      const data = res.data
      return Array.isArray(data) ? data.length : (data?.items?.length ?? 0)
    },
    staleTime: 60_000,
  })

  const unreadCount = unreadQuery.data ?? 0
  const installmentsCount = installmentsQuery.data ?? 0

  const displayName = user?.name || user?.email || 'Minha conta'
  const displaySubtitle = user?.email && user?.name ? user.email : ''
  const avatarLetter = (displayName.trim()[0] || 'U').toUpperCase()

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      signOut()
      return
    }
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Mais</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/transactions')}
          >
            <Feather name="search" size={20} color={darkTheme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/notifications')}
          >
            <Feather name="bell" size={20} color={darkTheme.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={unreadQuery.isRefetching || installmentsQuery.isRefetching}
            onRefresh={() => {
              unreadQuery.refetch()
              installmentsQuery.refetch()
            }}
            tintColor={darkTheme.accent}
            colors={[darkTheme.primary]}
          />
        }
      >
        {/* Cartão de Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSubtitle}>{displaySubtitle}</Text>
          </View>
        </View>

        {/* Grupo 1: Análises & Família */}
        <View style={styles.menuGroup}>
          <MenuItem
            icon="bar-chart-2"
            title="Resumo mensal"
            subtitle="Despesas por categoria"
            onPress={() => router.push('/monthly-summary')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="layers"
            title="Parcelamentos"
            subtitle={`${installmentsCount} compra(s) parcelada(s)`}
            onPress={() => router.push('/installments')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="users"
            title="Família"
            subtitle="Lançamentos compartilhados"
            onPress={() => router.push('/family')}
          />
        </View>

        {/* Grupo 2: Utilidades & Configurações */}
        <View style={styles.menuGroup}>
          <MenuItem
            icon="upload"
            title="Importar documento"
            subtitle="Fatura ou cupom · foto ou PDF"
            onPress={() => router.push('/invoice/import')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="bell"
            title="Notificações"
            subtitle={
              unreadCount > 0
                ? `${unreadCount} não lida(s) · alertas`
                : 'Nenhum alerta pendente'
            }
            badgeCount={unreadCount}
            onPress={() => router.push('/notifications')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="shield"
            title="Privacidade e dados"
            subtitle="Exportar dados e excluir conta"
            onPress={() => router.push('/privacy')}
          />
        </View>

        {/* Grupo 3: Sair */}
        <View style={styles.menuGroup}>
          <MenuItem
            icon="log-out"
            title="Sair"
            subtitle="Encerrar sessão"
            onPress={confirmSignOut}
          />
        </View>

        {/* Versão do App */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Koin v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.primary,
    borderWidth: 2,
    borderColor: darkTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },
  profileCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.accent,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  profileSubtitle: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  menuGroup: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemPressed: {
    opacity: 0.75,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    gap: 3,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: darkTheme.primary,
    marginRight: 4,
  },
  menuBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.border,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
})
