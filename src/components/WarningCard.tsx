import Feather from '@expo/vector-icons/Feather'
import { StyleSheet, Text, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

const WARNING = '#fbbf24'

interface WarningCardProps {
  title: string
  children: string
}

/** Aviso em âmbar: ícone de alerta, título e texto explicativo. */
export function WarningCard({ title, children }: WarningCardProps) {
  return (
    <View style={styles.card}>
      <Feather name="alert-triangle" size={18} color={WARNING} style={styles.icon} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5b3a12',
    backgroundColor: '#1a120a',
    padding: 14,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNING,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: darkTheme.textSecondary,
  },
})
