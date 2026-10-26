import { Pressable, StyleSheet, Text } from 'react-native'
import { darkTheme } from '@/theme/colors'

interface ActionButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  loading?: boolean
  disabled?: boolean
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || isDisabled) && styles.pressed,
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {loading ? 'Carregando...' : label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: darkTheme.primary,
  },
  secondary: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: darkTheme.text,
  },
  destructiveText: {
    color: '#ffffff',
  },
})
