import { Feather } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getApiErrorMessage } from '@/lib/errors'
import { leaveEventFlow } from '@/lib/event'
import { eventApi } from '@/services/event.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

const RESEND_SECONDS = 60

/** Confirmação do e-mail com o código de 6 dígitos, logo depois do cadastro no stand. */
export default function EventVerifyScreen() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function verify(value: string) {
    if (!/^\d{6}$/.test(value)) {
      setError('Digite os 6 números do código')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await eventApi.verify(value)
      queryClient.setQueryData(['event-signup'], data)
      router.replace('/event/stand')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível confirmar o código'))
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    setError(null)
    setInfo(null)
    try {
      await eventApi.resend()
      setCooldown(RESEND_SECONDS)
      setInfo('Mandamos um código novo. Confira também a caixa de spam.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível reenviar o código'))
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconBox}>
            <Feather name="mail" size={28} color={darkTheme.accent} />
          </View>
          <Text style={styles.title}>Confirme seu e-mail</Text>
          <Text style={styles.subtitle}>
            Mandamos um código de 6 números para{' '}
            <Text style={styles.bold}>{user?.email ?? 'o seu e-mail'}</Text>. Ele vale por 30
            minutos. Não chegou? Confira a caixa de spam.
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, '').slice(0, 6)
              setCode(digits)
              if (error) setError(null)
              if (digits.length === 6) verify(digits)
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            placeholder="000000"
            placeholderTextColor={darkTheme.textMuted}
            accessibilityLabel="Código de confirmação"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              submitting && styles.disabled,
            ]}
            onPress={() => verify(code)}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color={darkTheme.text} />
            ) : (
              <Text style={styles.primaryButtonText}>Confirmar</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={resend}
            disabled={cooldown > 0}
            accessibilityRole="button"
          >
            <Text style={[styles.linkText, cooldown > 0 && styles.linkTextDisabled]}>
              {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
            </Text>
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => leaveEventFlow(user?.id)}>
            <Text style={styles.laterText}>Fazer depois</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkTheme.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingTop: 40, gap: 16 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '600', color: darkTheme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: darkTheme.textSecondary, lineHeight: 22 },
  bold: { fontWeight: '700', color: darkTheme.text },
  codeInput: {
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: darkTheme.borderFocus,
    backgroundColor: darkTheme.surface,
    color: darkTheme.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  error: { color: darkTheme.error, fontSize: 14, textAlign: 'center' },
  info: { color: darkTheme.success, fontSize: 14, textAlign: 'center' },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: { backgroundColor: darkTheme.primaryPressed },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  disabled: { opacity: 0.6 },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 14, color: darkTheme.accent, fontWeight: '500' },
  linkTextDisabled: { color: darkTheme.textMuted },
  laterText: { fontSize: 14, color: darkTheme.textSecondary },
})
