import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { APP_VERSION } from '@/lib/config'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap
  title: string
  subtitle: string
  onPress: () => void
}

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
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
      <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
    </Pressable>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const displayName = user?.name || 'Pedro Andrade'
  const displaySubtitle = user?.email || 'Família Andrade'
  const avatarLetter = (displayName.trim()[0] || 'P').toUpperCase()

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
            onPress={() => Alert.alert('Notificações', 'Você possui 2 alertas pendentes.')}
          >
            <Feather name="bell" size={20} color={darkTheme.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            subtitle="4 compras parceladas"
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
            onPress={() => Alert.alert('Importar documento', 'Envie a foto ou PDF da sua fatura.')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="bell"
            title="Notificações"
            subtitle="2 não lidas · preferências de e-mail"
            onPress={() => Alert.alert('Notificações', 'Preferências de alertas e e-mail.')}
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
