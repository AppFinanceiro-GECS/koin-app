import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { InvoiceDuplicateWarning } from '@/types/invoice'

interface InvoiceDuplicateWarningProps {
  warning: InvoiceDuplicateWarning
}

export function InvoiceDuplicateWarningBanner({ warning }: InvoiceDuplicateWarningProps) {
  if (!warning.has_duplicates) return null

  return (
    <View className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
      <View className="flex-row items-start gap-3">
        <Ionicons name="alert-circle" size={24} color="#f87171" />
        <View className="flex-1">
          <Text className="text-red-400 font-bold">Possível duplicação detectada</Text>
          <Text className="text-red-300 text-sm mt-1">
            {warning.duplicate_count} parcela(s) duplicada(s) encontrada(s)
          </Text>
          <Text className="text-red-300 text-sm">
            Excesso estimado: R$ {warning.estimated_excess.toFixed(2)}
          </Text>

          {warning.affected_series_pairs.length > 0 && (
            <View className="mt-3 bg-red-900/50 rounded p-2">
              {warning.affected_series_pairs.map((pair, idx) => (
                <Text key={idx} className="text-red-300 text-xs">
                  • {pair.series_a_name} ↔ {pair.series_b_name}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
