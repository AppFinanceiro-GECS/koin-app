import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { notificationsApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'
import type { AppNotification } from '@/types/notification'

type FilterMode = 'all' | 'unread'

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `Há ${diffMins} min`
    if (diffHours < 24) return `Há ${diffHours}h`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `Há ${diffDays} dias`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return 'Recentemente'
  }
}

function getNotificationVisuals(notification: AppNotification) {
  const type = notification.type || ''

  if (type.includes('document') || notification.entity_type === 'document') {
    return {
      iconName: 'document-text-outline' as const,
      color: '#a78bfa',
      bgColor: 'rgba(167, 139, 250, 0.15)',
      badgeLabel: 'Documento',
    }
  }

  if (type.includes('invoice') || notification.entity_type === 'credit_card' || notification.entity_type === 'invoice') {
    const isOverdue = type.includes('overdue')
    return {
      iconName: isOverdue ? ('alert-circle-outline' as const) : ('card-outline' as const),
      color: isOverdue ? '#f43f5e' : '#f59e0b',
      bgColor: isOverdue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      badgeLabel: isOverdue ? 'Vencida' : 'Fatura',
    }
  }

  if (type.includes('balance') || notification.entity_type === 'account') {
    const isNegative = type.includes('negative')
    return {
      iconName: 'wallet-outline' as const,
      color: isNegative ? '#f43f5e' : '#38bdf8',
      bgColor: isNegative ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
      badgeLabel: 'Conta',
    }
  }

  if (type.includes('budget')) {
    return {
      iconName: 'pie-chart-outline' as const,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      badgeLabel: 'Orçamento',
    }
  }

  if (type.includes('goal')) {
    return {
      iconName: 'trophy-outline' as const,
      color: '#34d399',
      bgColor: 'rgba(52, 211, 153, 0.15)',
      badgeLabel: 'Meta',
    }
  }

  return {
    iconName: 'notifications-outline' as const,
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    badgeLabel: 'Aviso',
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterMode>('all')
  const [refreshing, setRefreshing] = useState(false)

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await notificationsApi.list({ limit: 100 })
      return (res.data || []) as AppNotification[]
    },
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data,
  })

  const unreadCount = unreadData?.unread_count ?? notifications.filter((n) => !n.is_read).length

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleNotificationAction = (notification: AppNotification) => {
    // If not read, mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }

    // Deep-link based on entity_type or action_url
    if (notification.entity_type === 'document' && notification.entity_id) {
      router.push({
        pathname: '/invoice/import',
        params: { documentId: String(notification.entity_id) },
      })
      return
    }

    if (notification.entity_type === 'account') {
      router.push('/accounts')
      return
    }

    if (notification.entity_type === 'credit_card' || notification.entity_type === 'invoice') {
      router.push('/invoices')
      return
    }

    if (notification.entity_type === 'transaction' && notification.entity_id) {
      router.push(`/transaction/${notification.entity_id}`)
      return
    }

    if (notification.action_url) {
      if (notification.action_url.includes('/documents')) {
        const docId = notification.entity_id || notification.action_url.split('/').pop()
        router.push({
          pathname: '/invoice/import',
          params: { documentId: String(docId) },
        })
        return
      }
      if (notification.action_url.includes('/accounts')) {
        router.push('/accounts')
        return
      }
      if (notification.action_url.includes('/invoices')) {
        router.push('/invoices')
        return
      }
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    return true
  })

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const visuals = getNotificationVisuals(item)
    const isUnread = !item.is_read

    return (
      <Pressable
        style={({ pressed }) => [
          styles.notificationCard,
          isUnread && styles.notificationCardUnread,
          pressed && styles.cardPressed,
        ]}
        onPress={() => handleNotificationAction(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: visuals.bgColor }]}>
            <Ionicons name={visuals.iconName} size={20} color={visuals.color} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.timestampText}>{formatRelativeTime(item.created_at)}</Text>
          </View>

          {/* Dismiss button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dispensar notificação"
            hitSlop={10}
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.btnPressed]}
            onPress={(e) => {
              e.stopPropagation()
              dismissMutation.mutate(item.id)
            }}
          >
            <Feather name="x" size={16} color={darkTheme.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.notificationMessage}>{item.message}</Text>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <View style={styles.badgeWrapper}>
            <View style={[styles.typeBadge, { borderColor: visuals.color + '40' }]}>
              <Text style={[styles.typeBadgeText, { color: visuals.color }]}>{visuals.badgeLabel}</Text>
            </View>
          </View>

          <View style={styles.footerActionsRight}>
            {isUnread && (
              <Pressable
                style={({ pressed }) => [styles.markReadBtn, pressed && styles.btnPressed]}
                onPress={(e) => {
                  e.stopPropagation()
                  markAsReadMutation.mutate(item.id)
                }}
              >
                <Feather name="check" size={14} color={darkTheme.accent} />
                <Text style={styles.markReadText}>Lida</Text>
              </Pressable>
            )}

            {(item.action_label || item.entity_type) && (
              <Pressable
                style={({ pressed }) => [styles.actionPill, pressed && styles.btnPressed]}
                onPress={() => handleNotificationAction(item)}
              >
                <Text style={styles.actionPillText}>{item.action_label || 'Ver detalhes'}</Text>
                <Feather name="arrow-right" size={13} color="#ffffff" />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={darkTheme.text} />
        </Pressable>

        <Text style={styles.navTitle}>Notificações</Text>

        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como lidas"
            style={({ pressed }) => [styles.markAllBtn, pressed && styles.btnPressed]}
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <ActivityIndicator size="small" color={darkTheme.accent} />
            ) : (
              <Text style={styles.markAllText}>Ler todas</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.navSpacer} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersBar}>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Todas ({notifications.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterChipText, filter === 'unread' && styles.filterChipTextActive]}>
            Não lidas ({unreadCount})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={darkTheme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificationItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 32 },
            filteredNotifications.length === 0 && styles.listEmptyCenter,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={darkTheme.accent}
              colors={[darkTheme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <Ionicons name="notifications-off-outline" size={36} color={darkTheme.accent} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Tudo limpo por aqui!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'unread'
                  ? 'Você já revisou todas as suas notificações pendentes.'
                  : 'Nenhum alerta ou novidade no momento.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  navBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: darkTheme.text,
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: darkTheme.accent,
  },
  navSpacer: {
    width: 40,
  },
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#191328',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: darkTheme.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: darkTheme.textMuted,
  },
  filterChipTextActive: {
    color: darkTheme.accent,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  listEmptyCenter: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    backgroundColor: '#0f0b1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#241b35',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  notificationCardUnread: {
    backgroundColor: '#140e26',
    borderColor: '#3a2b56',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: darkTheme.text,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: darkTheme.primary,
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: darkTheme.textMuted,
    marginTop: 2,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: 'Geist',
    fontWeight: '500',
  },
  footerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  markReadText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: darkTheme.accent,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: darkTheme.primary,
  },
  actionPillText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: darkTheme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardPressed: {
    opacity: 0.88,
  },
  btnPressed: {
    opacity: 0.7,
  },
})
