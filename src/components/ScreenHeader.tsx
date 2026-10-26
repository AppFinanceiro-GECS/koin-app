import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

interface ScreenHeaderProps {
  title: string
  /** "back" (seta) para telas empilhadas, "close" (X) para modais. */
  variant?: 'back' | 'close'
}

/** Cabeçalho centralizado das telas com tema escuro: botão à esquerda e título no meio. */
export function ScreenHeader({ title, variant = 'back' }: ScreenHeaderProps) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'))

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={variant === 'close' ? 'Fechar' : 'Voltar'}
        hitSlop={8}
        onPress={goBack}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Feather
          name={variant === 'close' ? 'x' : 'chevron-left'}
          size={variant === 'close' ? 22 : 26}
          color={darkTheme.text}
        />
      </Pressable>
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.button} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 52,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: darkTheme.text,
  },
})
