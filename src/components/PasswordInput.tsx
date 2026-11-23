import { Feather } from '@expo/vector-icons'
import { useState, type Ref } from 'react'
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'

import { darkTheme } from '@/theme/colors'

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  ref?: Ref<React.ComponentRef<typeof TextInput>>
}

/**
 * Campo de senha com o "olhinho": toca para ver o que está digitando e toca de novo
 * para esconder. Recebe o mesmo style do TextInput da tela; o ícone fica por cima, à direita.
 */
export function PasswordInput({ style, ref, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={ref}
        {...rest}
        style={[style, styles.input]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={darkTheme.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center' },
  input: { paddingRight: 48 },
  toggle: {
    position: 'absolute',
    right: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
