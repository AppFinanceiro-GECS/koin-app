import { View, Text, FlatList } from 'react-native'
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

export function InvoiceTransactionList({ transactions }: InvoiceTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <View className="py-8 items-center">
        <Ionicons name="receipt-outline" size={40} color="#64748b" />
        <Text className="text-slate-400 mt-2">Nenhuma transação</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View className="h-px bg-slate-800" />}
      renderItem={({ item }) => {
        const icon = getCategoryIcon(item.category_name)
        const isInstallment = item.installment_number && item.installment_total
        const amountColor = item.amount < 0 ? 'text-green-400' : 'text-white'

        return (
          <View className="py-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center mr-3">
                <Ionicons name={icon as any} size={20} color="#a855f7" />
              </View>

              <View className="flex-1">
                <Text className="text-white font-semibold">{item.description}</Text>
                <View className="flex-row items-center gap-2">
                  {item.merchant_name && (
                    <Text className="text-slate-400 text-xs">{item.merchant_name}</Text>
                  )}
                  {item.category_name && (
                    <Text className="text-slate-500 text-xs">• {item.category_name}</Text>
                  )}
                  {isInstallment && (
                    <Text className="text-slate-500 text-xs">
                      • {item.installment_number}/{item.installment_total}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View className="items-end">
              <Text className={`font-bold ${amountColor}`}>
                {item.amount < 0 ? '-' : ''}R$ {Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text className="text-slate-400 text-xs">
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
