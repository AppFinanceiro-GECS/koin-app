import Feather from '@expo/vector-icons/Feather'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { KoinLogoMark } from '@/components/KoinLogo'
import { darkTheme } from '@/theme/colors'

const STEPS: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: 'file-text', text: 'Envie o PDF ou uma foto da fatura' },
  { icon: 'credit-card', text: 'O Koin reconhece o cartão e as datas' },
  { icon: 'layers', text: 'Compras, parcelas e assinaturas separadas' },
]

/** Início sem cartão: o primeiro passo é a fatura, não um formulário */
export function StartWithInvoiceHero() {
  return (
    <LinearGradient
      colors={['#1f0c3b', '#120a26', '#0a0414']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <KoinLogoMark size={0.8} />
      <Text style={styles.title}>Comece pela sua fatura</Text>
      <Text style={styles.subtitle}>
        Em menos de um minuto você vê quanto vem na próxima fatura e o que já está comprometido nos
        próximos meses.
      </Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.text} style={styles.step}>
            <View style={styles.stepIcon}>
              <Feather name={step.icon} size={16} color={darkTheme.accent} />
            </View>
            <Text style={styles.stepText}>
              <Text style={styles.stepNumber}>{index + 1}. </Text>
              {step.text}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar fatura"
        onPress={() => router.push('/invoice/import')}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <Feather name="upload" size={18} color="#ffffff" />
        <Text style={styles.primaryText}>Enviar fatura</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/credit-card/modal')}
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>Prefiro cadastrar o cartão na mão</Text>
      </Pressable>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: darkTheme.text },
  subtitle: { fontSize: 15, lineHeight: 21, color: darkTheme.textSecondary },
  steps: { gap: 10, paddingVertical: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: 14, color: darkTheme.text },
  stepNumber: { color: darkTheme.accent, fontWeight: '700' },
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: darkTheme.primary,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  secondary: { alignItems: 'center', paddingVertical: 6 },
  secondaryText: { fontSize: 14, color: darkTheme.accent, fontWeight: '600' },
  pressed: { opacity: 0.8 },
})
