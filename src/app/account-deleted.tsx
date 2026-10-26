import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { IconTile } from '@/components/IconTile'
import { darkTheme } from '@/theme/colors'

/** Última tela do fluxo de exclusão: já sem sessão, por isso fica fora dos grupos protegidos. */
export default function AccountDeletedScreen() {
  const { family } = useLocalSearchParams<{ family?: string }>()

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Acesso encerrado
        </Text>
      </View>

      <View style={styles.content}>
        <IconTile icon="check" tone="success" />
        <Text style={styles.headline}>Conta excluída</Text>
        <Text style={styles.lead}>Sua sessão foi encerrada. Você não está mais conectado ao Koin.</Text>
        {family ? (
          <Text style={styles.lead}>
            As contas dos outros membros da {family} não são excluídas por esta solicitação.
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Voltar ao acesso</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  header: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: darkTheme.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: darkTheme.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
})
