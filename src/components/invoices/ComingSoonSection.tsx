import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ComingSoonItem {
  icon: string
  title: string
  description: string
}

interface ComingSoonSectionProps {
  title: string
  items: ComingSoonItem[]
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  item: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  itemTitle: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  itemDescription: {
    color: '#64748b',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
})

export function ComingSoonSection({ title, items }: ComingSoonSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.itemsContainer}>
        {items.map((item, idx) => (
          <TouchableOpacity key={idx} disabled style={styles.item}>
            <View style={styles.icon}>
              <Ionicons name={item.icon as any} size={20} color="#64748b" />
            </View>
            <View style={styles.info}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Em breve</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
