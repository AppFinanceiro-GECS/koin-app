import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { InvoiceDuplicateWarning } from '@/types/invoice'

interface InvoiceDuplicateWarningProps {
  warning: InvoiceDuplicateWarning
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#f87171',
    fontWeight: '700',
  },
  text: {
    color: '#fca5a5',
    fontSize: 14,
    marginTop: 4,
  },
  pairsBox: {
    marginTop: 12,
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderRadius: 4,
    padding: 8,
  },
  pairText: {
    color: '#fca5a5',
    fontSize: 12,
  },
})

export function InvoiceDuplicateWarningBanner({ warning }: InvoiceDuplicateWarningProps) {
  if (!warning.has_duplicates) return null

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="alert-circle" size={24} color="#f87171" />
        <View style={styles.content}>
          <Text style={styles.title}>Possível duplicação detectada</Text>
          <Text style={styles.text}>
            {warning.duplicate_count} parcela(s) duplicada(s) encontrada(s)
          </Text>
          <Text style={styles.text}>
            Excesso estimado: R$ {warning.estimated_excess.toFixed(2)}
          </Text>

          {warning.affected_series_pairs.length > 0 && (
            <View style={styles.pairsBox}>
              {warning.affected_series_pairs.map((pair, idx) => (
                <Text key={idx} style={styles.pairText}>
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
