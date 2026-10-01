import Ionicons from '@expo/vector-icons/Ionicons'
import { useInfiniteQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { Chip } from '@/components/Chip'
import { StateView } from '@/components/StateView'
import { TransactionRow } from '@/components/TransactionRow'
import { getApiErrorMessage } from '@/lib/errors'
import { transactionsApi } from '@/services/transactions.api'
import { colors, radius, spacing } from '@/theme/colors'
import type { TransactionType } from '@/types/api'

const PAGE_SIZE = 20
const FILTERS: { label: string; value: TransactionType | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Despesas', value: 'expense' },
  { label: 'Receitas', value: 'income' },
  { label: 'Transferências', value: 'transfer' },
]

export default function TransactionsScreen() {
  const [type, setType] = useState<TransactionType | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Debounce da busca (a API exige >= 2 caracteres)
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().length >= 2 ? searchInput.trim() : ''), 400)
    return () => clearTimeout(id)
  }, [searchInput])

  const query = useInfiniteQuery({
    queryKey: ['transactions', 'list', { type, search }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await transactionsApi.list({
          limit: PAGE_SIZE,
          offset: pageParam,
          ...(type ? { type } : {}),
          ...(search ? { search } : {}),
        })
      ).data,
    getNextPageParam: (last) => (last.has_more ? last.offset + last.limit : undefined),
  })

  const items = query.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Buscar transação"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Chip key={f.label} label={f.label} selected={type === f.value} onPress={() => setType(f.value)} />
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        ListEmptyComponent={
          <StateView
            loading={query.isLoading}
            error={query.error ? getApiErrorMessage(query.error, 'Não foi possível carregar as transações') : null}
            empty="Nenhuma transação encontrada"
            onRetry={query.refetch}
          />
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova transação"
        style={styles.fab}
        onPress={() => router.push('/transaction/new')}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  footer: { padding: spacing.lg },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
})
