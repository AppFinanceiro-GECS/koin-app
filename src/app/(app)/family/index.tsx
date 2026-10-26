import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { familyDisplayName, memberFirstName } from '@/lib/family'
import { formatCurrency, formatDate, monthName, toISODate } from '@/lib/format'
import { familyApi } from '@/services/settings.api'
import { transactionsApi } from '@/services/transactions.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'
import type { HouseholdMember, Transaction } from '@/types/api'

const PAGE_SIZE = 100
const MAX_PAGES = 5

/** O web gravou 'family' em alguns lançamentos; a API usa 'household'. */
const isShared = (t: Transaction) => t.ownership_type === 'household' || t.ownership_type === 'family'

async function fetchSharedExpenses(year: number, month: number): Promise<Transaction[]> {
  const params = {
    start_date: toISODate(new Date(year, month - 1, 1)),
    end_date: toISODate(new Date(year, month, 0)),
    limit: PAGE_SIZE,
  }
  const shared: Transaction[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await transactionsApi.list({ ...params, offset: page * PAGE_SIZE })
    shared.push(...data.items.filter((t) => isShared(t) && t.type === 'expense'))
    if (!data.has_more) break
  }
  return shared.sort((a, b) => b.date.localeCompare(a.date))
}

function categoryIcon(categoryName?: string | null): keyof typeof Ionicons.glyphMap {
  const cat = (categoryName || '').toLowerCase()
  if (cat.includes('mercado') || cat.includes('alimen')) return 'cart-outline'
  if (cat.includes('conta') || cat.includes('serviço')) return 'flash-outline'
  if (cat.includes('assin')) return 'repeat-outline'
  if (cat.includes('saúde') || cat.includes('farm')) return 'medkit-outline'
  if (cat.includes('moradia')) return 'home-outline'
  if (cat.includes('transporte')) return 'car-outline'
  return 'pricetag-outline'
}

function memberRoleLabel(member: HouseholdMember, currentUserId?: number): string {
  if (member.user_id === currentUserId) return 'Você'
  return member.role === 'owner' ? 'Admin' : 'Membro'
}

export default function FamilyScreen() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const currentUserId = useAuthStore((s) => s.user?.id)

  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })

  const sharedQuery = useQuery({
    queryKey: ['transactions', 'household', year, month],
    queryFn: () => fetchSharedExpenses(year, month),
    enabled: familyQuery.isSuccess,
  })

  const family = familyQuery.data
  const shared = sharedQuery.data
  const sharedTotal = useMemo(
    () => (shared ?? []).reduce((sum, t) => sum + Number(t.amount), 0),
    [shared]
  )

  const canInvite = Boolean(family?.can_invite) && (family?.member_count ?? 0) < (family?.max_members ?? 0)

  const refreshing = familyQuery.isRefetching || sharedQuery.isRefetching
  const onRefresh = () => {
    familyQuery.refetch()
    sharedQuery.refetch()
  }

  // A API responde 403 quando a conta ainda não está vinculada a uma família.
  const noFamily = (familyQuery.error as { response?: { status?: number } } | null)?.response?.status === 403

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={family ? familyDisplayName(family.members) : 'Família'} />

      {familyQuery.isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={darkTheme.accent} size="large" />
        </View>
      ) : familyQuery.isError || !family ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            {noFamily
              ? 'Sua conta ainda não está vinculada a uma família.'
              : getApiErrorMessage(familyQuery.error, 'Não foi possível carregar a família')}
          </Text>
          {!noFamily && (
            <Pressable
              accessibilityRole="button"
              onPress={() => familyQuery.refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={darkTheme.accent}
              colors={[darkTheme.primary]}
            />
          }
        >
          {/* Membros */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Membros</Text>
            <View style={styles.membersGrid}>
              {family.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {memberFirstName(member).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.memberName}>
                    {memberFirstName(member)}
                  </Text>
                  <Text style={styles.memberRole}>{memberRoleLabel(member, currentUserId)}</Text>
                </View>
              ))}
              {canInvite && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Convidar membro"
                  onPress={() => router.push('/family/invite')}
                  style={({ pressed }) => [styles.memberItem, pressed && styles.pressed]}
                >
                  <View style={styles.avatar}>
                    <Feather name="plus" size={18} color={darkTheme.accent} />
                  </View>
                  <Text style={styles.memberName}>Convidar</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Compartilhado no mês */}
          <LinearGradient
            colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel}>Compartilhado em {monthName(month)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(sharedTotal)}</Text>
            {/* TODO: a API ainda não divide lançamentos entre membros nem calcula saldo/acerto. */}
            <Text style={styles.totalHint}>Divisão entre membros em breve</Text>
            <View
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              style={styles.settleButton}
            >
              <Text style={styles.settleText}>Acertar</Text>
            </View>
          </LinearGradient>

          {/* Lançamentos com a tag Família */}
          <Text style={styles.sectionTitle}>Lançamentos com a tag Família</Text>
          <View style={[styles.card, styles.listCard]}>
            {sharedQuery.isLoading ? (
              <ActivityIndicator color={darkTheme.accent} style={styles.listState} />
            ) : sharedQuery.isError ? (
              <Text style={[styles.emptyText, styles.listState]}>
                {getApiErrorMessage(sharedQuery.error, 'Não foi possível carregar os lançamentos')}
              </Text>
            ) : !shared || shared.length === 0 ? (
              <Text style={[styles.emptyText, styles.listState]}>
                Nenhum lançamento com a tag Família em {monthName(month)}.
              </Text>
            ) : (
              shared.map((t, index) => (
                <View key={t.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={categoryIcon(t.category_name)} size={20} color={darkTheme.accent} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text numberOfLines={1} style={styles.rowTitle}>
                      {t.description || t.merchant_name || t.category_name || 'Lançamento'}
                    </Text>
                    <Text numberOfLines={1} style={styles.rowSubtitle}>
                      {t.category_name ?? 'Sem categoria'} · {formatDate(t.date).slice(0, 5)}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>{formatCurrency(t.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  pressed: {
    opacity: 0.75,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  stateBox: {
    paddingVertical: 64,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 16,
  },
  stateText: {
    fontSize: 15,
    color: darkTheme.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: darkTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.accent,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 24,
    padding: 16,
  },
  listCard: {
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    marginTop: 12,
  },
  memberItem: {
    width: '25%',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1d1536',
    borderWidth: 1,
    borderColor: '#3b2a6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.accent,
  },
  memberName: {
    fontSize: 12,
    color: darkTheme.text,
  },
  memberRole: {
    fontSize: 11,
    color: darkTheme.textMuted,
  },
  totalCard: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 24,
    padding: 16,
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  totalHint: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    marginTop: 8,
  },
  settleButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: darkTheme.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    opacity: 0.45,
  },
  settleText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.accent,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  listState: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: darkTheme.text,
  },
})
