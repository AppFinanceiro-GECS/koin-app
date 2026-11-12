import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { FamilySplitCard } from '@/components/family/FamilySplitCard'
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
  const queryClient = useQueryClient()
  const now = new Date()
  // mês exibido: começa no atual e navega para trás e para a frente
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const { year, month } = period
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const shiftMonth = (delta: number) =>
    setPeriod(({ year: y, month: m }) => {
      const index = y * 12 + (m - 1) + delta
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })
  const currentUserId = useAuthStore((s) => s.user?.id)

  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })

  const createFamilyMutation = useMutation({
    mutationFn: async () => (await familyApi.create()).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['family', 'context'], data)
      queryClient.invalidateQueries({ queryKey: ['family'] })
    },
    onError: (err) => {
      Alert.alert(
        'Erro ao iniciar família',
        getApiErrorMessage(err, 'Não foi possível criar o grupo familiar.')
      )
    },
  })

  const sharedQuery = useQuery({
    queryKey: ['transactions', 'household', year, month],
    queryFn: () => fetchSharedExpenses(year, month),
    enabled: familyQuery.isSuccess,
  })

  const splitQuery = useQuery({
    queryKey: ['family', 'split', year, month],
    queryFn: async () => (await familyApi.split(year, month)).data,
    enabled: familyQuery.isSuccess,
  })

  const family = familyQuery.data
  const shared = sharedQuery.data
  const splitNames = useMemo(
    () => new Map((splitQuery.data?.members ?? []).map((m) => [m.user_id, m.name])),
    [splitQuery.data]
  )

  const canInvite = Boolean(family?.can_invite) && (family?.member_count ?? 0) < (family?.max_members ?? 0)

  const refreshing = familyQuery.isRefetching || sharedQuery.isRefetching || splitQuery.isRefetching
  const onRefresh = () => {
    familyQuery.refetch()
    sharedQuery.refetch()
    splitQuery.refetch()
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
      ) : noFamily ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#1c1033', '#120b24', '#0d0718']}
            style={styles.emptyHero}
          >
            <View style={styles.heroIconBadge}>
              <Feather name="users" size={36} color="#c084fc" />
            </View>
            <Text style={styles.emptyTitle}>Comece sua Família no Koin</Text>
            <Text style={styles.emptySubtitle}>
              Organize as finanças de casa em conjunto, mantendo a privacidade do que for pessoal.
            </Text>
          </LinearGradient>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="pie-chart-outline" size={20} color="#a78bfa" />
              </View>
              <View style={styles.benefitTextBox}>
                <Text style={styles.benefitTitle}>Visão compartilhada do mês</Text>
                <Text style={styles.benefitDescription}>
                  Acompanhem juntos o total gasto pela casa, com divisão clara por categorias.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="card-outline" size={20} color="#a78bfa" />
              </View>
              <View style={styles.benefitTextBox}>
                <Text style={styles.benefitTitle}>Contas e cartões da casa</Text>
                <Text style={styles.benefitDescription}>
                  Escolha exatamente quais contas e faturas deseja compartilhar com a família.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#a78bfa" />
              </View>
              <View style={styles.benefitTextBox}>
                <Text style={styles.benefitTitle}>Privacidade garantida</Text>
                <Text style={styles.benefitDescription}>
                  Cada membro mantém suas movimentações pessoais totalmente privadas.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Criar grupo familiar"
            onPress={() => createFamilyMutation.mutate()}
            disabled={createFamilyMutation.isPending}
            style={({ pressed }) => [styles.createFamilyButton, pressed && styles.pressed]}
          >
            {createFamilyMutation.isPending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Feather name="plus-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.createFamilyButtonText}>Criar grupo familiar</Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/family/join')}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
          >
            <Feather name="key" size={16} color={darkTheme.accent} />
            <Text style={styles.joinText}>Tenho um código de convite</Text>
          </Pressable>
        </ScrollView>
      ) : familyQuery.isError || !family ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            {getApiErrorMessage(familyQuery.error, 'Não foi possível carregar a família')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => familyQuery.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
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

          {/* Sozinho na família: pode entrar na de outra pessoa */}
          {family.member_count === 1 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/family/join')}
              style={({ pressed }) => [styles.joinInline, pressed && styles.pressed]}
            >
              <Feather name="key" size={16} color={darkTheme.accent} />
              <Text style={styles.joinText}>Foi convidado para outra família? Entrar com o código</Text>
            </Pressable>
          )}

          {/* Mês */}
          <View style={styles.monthNav}>
            <Pressable accessibilityLabel="Mês anterior" hitSlop={10} onPress={() => shiftMonth(-1)}>
              <Feather name="chevron-left" size={22} color={darkTheme.text} />
            </Pressable>
            <Text style={styles.monthText}>
              {monthName(month).charAt(0).toUpperCase() + monthName(month).slice(1)} {year}
            </Text>
            <Pressable
              accessibilityLabel="Próximo mês"
              hitSlop={10}
              disabled={isCurrentMonth}
              onPress={() => shiftMonth(1)}
            >
              <Feather name="chevron-right" size={22} color={isCurrentMonth ? darkTheme.textMuted : darkTheme.text} />
            </Pressable>
          </View>

          {/* Quem pagou o quê e quem deve a quem */}
          <FamilySplitCard
            split={splitQuery.data}
            loading={splitQuery.isLoading}
            error={splitQuery.error}
            isOwner={Boolean(family.is_owner)}
            onRetry={() => splitQuery.refetch()}
          />

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
                      {t.user_id && splitNames.get(t.user_id) ? ` · pago por ${splitNames.get(t.user_id)}` : ''}
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
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
  },
  joinInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  joinText: { color: darkTheme.accent, fontWeight: '600', fontSize: 14, flexShrink: 1 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthText: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
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
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyHero: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b1d6e',
  },
  heroIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsList: {
    gap: 16,
    marginBottom: 28,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#110c1f',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#24173d',
    gap: 14,
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextBox: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  createFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  createFamilyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
})
