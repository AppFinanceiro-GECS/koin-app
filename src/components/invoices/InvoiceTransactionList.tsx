import { View, Text, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { InvoiceTransactionResponse } from '@/types/invoice'

interface InvoiceTransactionListProps {
  transactions: InvoiceTransactionResponse[]
}

const getCategoryIcon = (categoryName?: string | null) => {
  const categoryLower = (categoryName ?? '')?.toLowerCase() || ''

  const iconMap: Record<string, string> = {
    alimentação: 'fast-food',
    supermercado: 'cart',
    transporte: 'car',
    combustível: 'flash',
    farmácia: 'medkit',
    restaurante: 'restaurant',
    streaming: 'play-circle',
    educação: 'book',
    saúde: 'heart',
    beleza: 'cut',
    lazer: 'game-controller',
    eletrônicos: 'laptop',
    moda: 'shirt',
    viagem: 'airplane',
    hotel: 'bed',
    utilidades: 'wrench',
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryLower.includes(key)) {
      return icon
    }
  }
  return 'shopping-bag'
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  row: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
  },
  description: {
    color: '#ffffff',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchantText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  categoryText: {
    color: '#64748b',
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
    color: '#ffffff',
  },
  amountGreen: {
    fontWeight: '700',
    color: '#4ade80',
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 12,
  },
})

export function InvoiceTransactionList({ transactions }: InvoiceTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={40} color="#64748b" />
        <Text style={styles.emptyText}>Nenhuma transação</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const icon = getCategoryIcon(item.category_name)
        const isInstallment = item.installment_number && item.installment_total
        const amountStyle = item.amount < 0 ? styles.amountGreen : styles.amount

        return (
          <View style={styles.row}>
            <View style={styles.leftSection}>
              <View style={styles.iconBox}>
                <Ionicons name={icon as any} size={20} color="#a855f7" />
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.description}>{item.description}</Text>
                <View style={styles.infoRow}>
                  {item.merchant_name && (
                    <Text style={styles.merchantText}>{item.merchant_name}</Text>
                  )}
                  {item.category_name && (
                    <Text style={styles.categoryText}>• {item.category_name}</Text>
                  )}
                  {isInstallment && (
                    <Text style={styles.categoryText}>
                      • {item.installment_number}/{item.installment_total}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.rightSection}>
              <Text style={amountStyle}>
                {item.amount < 0 ? '-' : ''}R$ {Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )
      }}
    />
  )
}
