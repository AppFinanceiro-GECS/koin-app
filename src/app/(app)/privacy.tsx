import { router } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { IconTile } from '@/components/IconTile'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Tag } from '@/components/Tag'
import { LEGAL_LINKS } from '@/lib/config'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface LinkRowProps {
  label: string
  action: string
  url: string | null
}

function LinkRow({ label, action, url }: LinkRowProps) {
  const available = Boolean(url)
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={() => url && Linking.openURL(url)}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={[styles.linkAction, !available && styles.linkActionDisabled]}>
        {available ? `${action} →` : 'Em breve'}
      </Text>
    </Pressable>
  )
}

export default function PrivacyScreen() {
  const user = useAuthStore((s) => s.user)

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title="Privacidade e dados" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <IconTile icon="shield" />
        <Text style={styles.headline}>Seus dados</Text>
        {user && (
          <Text style={styles.identity}>
            {user.name} · {user.email}
          </Text>
        )}

        <View style={styles.card}>
          <LinkRow label="Política de privacidade" action="Consultar" url={LEGAL_LINKS.privacy} />
          <LinkRow label="Termos de uso" action="Consultar" url={LEGAL_LINKS.terms} />
          <LinkRow label="Suporte" action="Abrir canal" url={LEGAL_LINKS.support} />
        </View>

        <View style={styles.card}>
          <Tag label="Dados pessoais" />
          <Text style={styles.cardText}>
            Solicite uma cópia dos seus registros ou revise a exclusão da sua conta.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/delete-account')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Excluir minha conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  pressed: {
    opacity: 0.75,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  identity: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginTop: -6,
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  linkLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  linkAction: {
    fontSize: 14,
    color: darkTheme.text,
  },
  linkActionDisabled: {
    color: darkTheme.textMuted,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: darkTheme.textSecondary,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
  },
})
