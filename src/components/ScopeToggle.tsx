import { Pressable, StyleSheet, Text, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

export type Scope = 'me' | 'family'

const OPTIONS: { value: Scope; label: string }[] = [
  { value: 'me', label: 'Só eu' },
  { value: 'family', label: 'Família' },
]

interface ScopeToggleProps {
  value: Scope
  onChange: (value: Scope) => void
}

/** Par de chips "Só eu / Família" das telas com tema escuro. */
export function ScopeToggle({ value, onChange }: ScopeToggleProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = value === option.value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${option.label}`}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  chipInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: darkTheme.accent,
  },
  labelInactive: {
    color: darkTheme.textSecondary,
  },
})
