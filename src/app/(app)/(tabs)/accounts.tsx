import { useQuery } from '@tanstack/react-query'
import { FlatList, StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/Card'
import { StateView } from '@/components/StateView'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { accountsApi } from '@/services/accounts.api'
import { colors, spacing } from '@/theme/colors'
import type { AccountType } from '@/types/api'

const TYPE_LABEL: Record<AccountType, string> = {
  wallet: 'Carteira',
  bank: 'Conta bancária',
  credit_card: 'Cartão de crédito',
  investment: 'Investimento',
  benefit_card: 'Cartão benefício',
}

export default function AccountsScreen() {
  const query = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const accounts = (query.data ?? []).filter((a) => a.is_active)
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <FlatList
      data={accounts}
      keyExtractor={(a) => String(a.id)}
      contentContainerStyle={styles.content}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      ListHeaderComponent={
        accounts.length ? (
          <Card style={styles.total}>
            <Text style={styles.totalLabel}>Saldo total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </Card>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Card style={styles.account}>
          <View style={[styles.dot, { backgroundColor: item.color || colors.navyLight }]} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.type}>
              {TYPE_LABEL[item.type] ?? item.type}
              {item.ownership_type === 'household' ? ' · família' : ''}
            </Text>
          </View>
          <Text style={[styles.balance, item.balance < 0 && { color: colors.expense }]}>
            {formatCurrency(item.balance)}
          </Text>
        </Card>
      )}
      ListEmptyComponent={
        <StateView
          loading={query.isLoading}
          error={query.error ? getApiErrorMessage(query.error, 'Não foi possível carregar as contas') : null}
          empty="Nenhuma conta cadastrada"
          onRetry={query.refetch}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  total: { backgroundColor: colors.navy, borderColor: colors.navy, gap: spacing.xs, marginBottom: spacing.sm },
  totalLabel: { fontSize: 13, color: '#bcccdc' },
  totalValue: { fontSize: 28, fontWeight: '700', color: colors.white },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  type: { fontSize: 13, color: colors.textMuted },
  balance: { fontSize: 16, fontWeight: '700', color: colors.text },
})
